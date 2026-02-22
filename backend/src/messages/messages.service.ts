import { ForbiddenException, NotFoundException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { JwtPayload } from '../common/decorators/current-user.decorator';

/** Allowed pairs: Admin↔any; Employee↔Admin; Employee↔Client (same project); Client↔Admin; Client↔Employee (same project). */
@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) { }

  private async canMessage(senderId: string, receiverId: string): Promise<boolean> {
    if (senderId === receiverId) return false;
    const [sender, receiver] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: senderId }, select: { role: true, clientCompanyId: true } }),
      this.prisma.user.findUnique({ where: { id: receiverId }, select: { role: true, clientCompanyId: true } }),
    ]);
    if (!sender || !receiver) return false;
    // Admin ↔ any
    if (sender.role === Role.ADMIN || receiver.role === Role.ADMIN) return true;
    if (sender.role === Role.EMPLOYEE && receiver.role === Role.CLIENT) {
      if (!receiver.clientCompanyId) return false;
      const shared = await this.prisma.projectEmployee.findFirst({
        where: {
          employeeId: senderId,
          project: { clientId: receiver.clientCompanyId },
        },
      });
      return !!shared;
    }
    if (sender.role === Role.CLIENT && receiver.role === Role.EMPLOYEE) {
      if (!sender.clientCompanyId) return false;
      const shared = await this.prisma.projectEmployee.findFirst({
        where: {
          employeeId: receiverId,
          project: { clientId: sender.clientCompanyId },
        },
      });
      return !!shared;
    }
    return false;
  }

  async create(senderId: string, dto: CreateMessageDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
    });
    if (!receiver || !receiver.isActive) {
      throw new NotFoundException('Receiver not found');
    }
    const allowed = await this.canMessage(senderId, dto.receiverId);
    if (!allowed) {
      throw new ForbiddenException('You are not allowed to message this user');
    }
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        content: dto.content,
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getConversation(userId: string, query: QueryMessagesDto) {
    const { peerId, page = 1, limit = 20 } = query;
    const allowed = await this.canMessage(userId, peerId);
    if (!allowed) {
      throw new ForbiddenException('You are not allowed to view this conversation');
    }
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.message.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getChatPartners(userParam: JwtPayload) {
    // Return users the current user is allowed to chat with
    if (userParam.role === Role.ADMIN) {
      const users = await this.prisma.user.findMany({
        where: { id: { not: userParam.sub }, isActive: true },
        select: { id: true, name: true, role: true, clientCompany: { select: { name: true } } },
      });
      return users.map(u => ({ ...u, category: u.clientCompany?.name || u.role }));
    }

    if (userParam.role === Role.EMPLOYEE) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true, name: true, role: true },
      });

      const projects = await this.prisma.projectEmployee.findMany({
        where: { employeeId: userParam.sub },
        select: { project: { select: { clientId: true } } },
      });
      const clientCompanyIds = projects.map(p => p.project.clientId);

      const clients = await this.prisma.user.findMany({
        where: { role: Role.CLIENT, clientCompanyId: { in: clientCompanyIds }, isActive: true },
        select: { id: true, name: true, role: true, clientCompany: { select: { name: true } } },
      });

      return [
        ...admins.map(a => ({ ...a, category: 'Management' })),
        ...clients.map(c => ({ ...c, category: c.clientCompany?.name || 'Client' }))
      ];
    }

    if (userParam.role === Role.CLIENT) {
      const admins = await this.prisma.user.findMany({
        where: { role: Role.ADMIN, isActive: true },
        select: { id: true, name: true, role: true },
      });

      const me = await this.prisma.user.findUnique({
        where: { id: userParam.sub },
        select: { clientCompanyId: true },
      });

      if (!me?.clientCompanyId) return admins.map(a => ({ ...a, category: 'Support' }));

      const projects = await this.prisma.project.findMany({
        where: { clientId: me.clientCompanyId },
        select: { id: true },
      });
      const projectIds = projects.map(p => p.id);

      const assignments = await this.prisma.projectEmployee.findMany({
        where: { projectId: { in: projectIds } },
        select: { employee: { select: { id: true, name: true, role: true, isActive: true } } },
      });

      const employeeMap = new Map();
      assignments.forEach(a => {
        if (a.employee.isActive) employeeMap.set(a.employee.id, { ...a.employee, category: 'Project Team' });
      });

      return [
        ...admins.map(a => ({ ...a, category: 'Support' })),
        ...Array.from(employeeMap.values())
      ];
    }

    return [];
  }
}
