import { BadRequestException, ForbiddenException, NotFoundException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(user: JwtPayload) {
    if (user.role === Role.ADMIN) {
      return this.prisma.serviceRequest.findMany({
        include: { service: true, client: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.CLIENT) {
      const u = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { clientCompanyId: true },
      });
      if (!u?.clientCompanyId) return [];

      return this.prisma.serviceRequest.findMany({
        where: { clientId: u.clientCompanyId },
        include: { service: true, client: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return [];
  }

  async create(user: JwtPayload, dto: CreateServiceRequestDto) {
    if (user.role !== Role.CLIENT) {
      throw new ForbiddenException('Only CLIENT can create service requests');
    }
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { clientCompanyId: true },
    });
    if (!u?.clientCompanyId) {
      throw new ForbiddenException('User must be linked to a client company');
    }
    if (dto.clientId !== u.clientCompanyId) {
      throw new ForbiddenException('clientId must match your client company');
    }
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const client = await this.prisma.clientCompany.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client company not found');
    }
    return this.prisma.serviceRequest.create({
      data: {
        clientId: dto.clientId,
        serviceId: dto.serviceId,
        details: dto.details ?? null,
        createdBy: user.sub,
      },
      include: { service: true, client: true },
    });
  }

  /**
   * Approve service request in a single transaction:
   * 1. Set ServiceRequest.status = APPROVED
   * 2. Create Project { name: "<Service.name> for <Client.name>", description: details, clientId }
   * 3. Return the created Project
   */
  async approve(id: string) {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { service: true, client: true },
    });
    if (!req) {
      throw new NotFoundException('Service request not found');
    }
    if (req.status === 'APPROVED') {
      throw new BadRequestException('Service request already approved');
    }
    const projectName = `${req.service.name} for ${req.client.name}`;
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.serviceRequest.update({
        where: { id },
        data: { status: 'APPROVED' },
      });
      const project = await tx.project.create({
        data: {
          name: projectName,
          description: req.details ?? null,
          clientId: req.clientId,
          status: 'NOT_STARTED',
        },
        include: { client: true },
      });
      return project;
    });
    return result;
  }
}
