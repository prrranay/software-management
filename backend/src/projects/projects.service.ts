import { ForbiddenException, NotFoundException, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  private get projectInclude() {
    return {
      client: true,
      assignments: {
        include: {
          employee: { select: { id: true, name: true, email: true } },
        },
      },
    };
  }

  async findAll(user: JwtPayload) {
    if (user.role === Role.ADMIN) {
      return this.prisma.project.findMany({
        include: this.projectInclude,
        orderBy: { updatedAt: 'desc' },
      });
    }
    if (user.role === Role.EMPLOYEE) {
      return this.prisma.project.findMany({
        where: { assignments: { some: { employeeId: user.sub } } },
        include: this.projectInclude,
        orderBy: { updatedAt: 'desc' },
      });
    }
    if (user.role === Role.CLIENT) {
      const u = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { clientCompanyId: true },
      });
      if (!u?.clientCompanyId) {
        return [];
      }
      return this.prisma.project.findMany({
        where: { clientId: u.clientCompanyId },
        include: this.projectInclude,
        orderBy: { updatedAt: 'desc' },
      });
    }
    return [];
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        clientId: dto.clientId,
      },
      include: this.projectInclude,
    });
  }

  async update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({
      where: { id },
      data: dto,
      include: this.projectInclude,
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.projectEmployee.deleteMany({ where: { projectId: id } });
      return tx.project.delete({
        where: { id },
      });
    });
  }

  async assign(projectId: string, dto: AssignProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const employees = await this.prisma.user.findMany({
      where: { id: { in: dto.employeeIds }, role: Role.EMPLOYEE, isActive: true },
    });
    if (employees.length !== dto.employeeIds.length) {
      throw new ForbiddenException('Some IDs are not valid employees');
    }
    await this.prisma.projectEmployee.createMany({
      data: dto.employeeIds.map((employeeId) => ({ projectId, employeeId })),
      skipDuplicates: true,
    });
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: this.projectInclude,
    });
  }

  /** Unassign one employee from project. ADMIN only. Cannot unassign self (employeeId !== currentUser.id). */
  async unassign(projectId: string, employeeId: string, currentUserId: string) {
    if (employeeId === currentUserId) {
      throw new ForbiddenException('Cannot unassign yourself');
    }
    const assignment = await this.prisma.projectEmployee.findFirst({
      where: { projectId, employeeId },
      include: { project: true },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    await this.prisma.projectEmployee.delete({
      where: { id: assignment.id },
    });
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: this.projectInclude,
    });
  }

  /** Update project status. Allowed for assigned employee(s) or ADMIN. */
  async updateStatus(projectId: string, dto: UpdateProjectStatusDto, user: JwtPayload) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { assignments: { select: { employeeId: true } } },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const isAssigned = project.assignments.some((a) => a.employeeId === user.sub);
    if (user.role !== Role.ADMIN && !isAssigned) {
      throw new ForbiddenException('Only assigned employees or ADMIN can update project status');
    }
    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: dto.status },
      include: { client: true, assignments: { include: { employee: { select: { id: true, name: true, email: true } } } } },
    });
  }
}
