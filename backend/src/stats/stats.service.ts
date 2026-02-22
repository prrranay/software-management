import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, RequestStatus } from '@prisma/client';

@Injectable()
export class StatsService {
    constructor(private readonly prisma: PrismaService) { }

    async getAdminStats() {
        const [totalProjects, activeEmployees, activeClients, pendingRequests] = await Promise.all([
            this.prisma.project.count(),
            this.prisma.user.count({ where: { role: Role.EMPLOYEE, isActive: true } }),
            this.prisma.user.count({ where: { role: Role.CLIENT, isActive: true } }),
            this.prisma.serviceRequest.count({ where: { status: RequestStatus.PENDING } }),
        ]);

        return {
            totalProjects,
            activeEmployees,
            activeClients,
            pendingRequests,
        };
    }
}
