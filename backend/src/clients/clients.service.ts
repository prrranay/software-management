import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.clientCompany.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(name: string) {
    return this.prisma.clientCompany.create({
      data: { name },
    });
  }

  async update(id: string, name: string) {
    return this.prisma.clientCompany.update({
      where: { id },
      data: { name },
    });
  }

  async remove(id: string) {
    return this.prisma.clientCompany.delete({
      where: { id },
    });
  }

  /** GET /clients/:id/projects — clients see only their projects (id must be their clientCompanyId). */
  async getProjects(clientId: string, user: JwtPayload) {
    if (user.role !== Role.CLIENT) {
      throw new ForbiddenException('Only CLIENT can access this endpoint');
    }
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { clientCompanyId: true },
    });
    if (!u?.clientCompanyId || u.clientCompanyId !== clientId) {
      throw new ForbiddenException('You can only view your own company projects');
    }
    return this.prisma.project.findMany({
      where: { clientId },
      include: { client: true, assignments: { include: { employee: { select: { id: true, name: true, email: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
