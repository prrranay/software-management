import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  /** GET /employees/me/projects — only assigned projects. */
  async getMyProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { assignments: { some: { employeeId: userId } } },
      include: { client: true, assignments: { include: { employee: { select: { id: true, name: true, email: true } } } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
