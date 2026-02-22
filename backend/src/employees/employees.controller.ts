import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EMPLOYEE)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me/projects')
  @ApiOperation({ summary: 'List my assigned projects (EMPLOYEE only)' })
  @ApiResponse({ status: 200, description: 'List of assigned projects' })
  async getMyProjects(@CurrentUser() user: JwtPayload) {
    return this.employeesService.getMyProjects(user.sub);
  }
}
