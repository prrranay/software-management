import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin-stats')
@ApiBearerAuth('access-token')
@Controller('admin/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get()
    @ApiOperation({ summary: 'Get dashboard stats (ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Stats data' })
    async getStats() {
        return this.statsService.getAdminStats();
    }
}
