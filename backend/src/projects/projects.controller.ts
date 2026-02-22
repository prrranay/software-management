import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { AssignProjectDto } from './dto/assign-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth('access-token')
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.CLIENT)
  @ApiOperation({ summary: 'List projects (role-scoped)' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(user);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE, Role.CLIENT)
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create project manually (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update project details (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Project updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete project (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign employees to project (ADMIN only)' })
  @ApiBody({ schema: { example: { employeeIds: ['uuid-employee-1', 'uuid-employee-2'] } } })
  @ApiResponse({ status: 200, description: 'Project with assignments' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async assign(
    @Param('id') projectId: string,
    @Body() dto: AssignProjectDto,
  ) {
    return this.projectsService.assign(projectId, dto);
  }

  @Delete(':id/assign/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Unassign employee from project (ADMIN only, cannot unassign self)' })
  @ApiResponse({ status: 200, description: 'Project with updated assignments' })
  @ApiResponse({ status: 403, description: 'Forbidden (e.g. self-unassign)' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async unassign(
    @Param('id') projectId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.unassign(projectId, employeeId, user.sub);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.EMPLOYEE)
  @ApiOperation({ summary: 'Update project status (assigned employee or ADMIN)' })
  @ApiBody({ schema: { example: { status: 'IN_PROGRESS' } } })
  @ApiResponse({ status: 200, description: 'Updated project' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async updateStatus(
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.projectsService.updateStatus(projectId, dto, user);
  }
}
