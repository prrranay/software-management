import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ClientsService } from './clients.service';
import { CreateClientCompanyDto } from './dto/create-client-company.dto';
import { UpdateClientCompanyDto } from './dto/update-client-company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth('access-token')
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CLIENT, Role.ADMIN)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) { }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List client companies (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of client companies' })
  async findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create client company (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Company created' })
  async create(@Body() dto: CreateClientCompanyDto) {
    return this.clientsService.create(dto.name);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update client company (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Company updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateClientCompanyDto) {
    return this.clientsService.update(id, dto.name!);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete client company (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Company deleted' })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Get(':id/projects')
  @ApiOperation({ summary: 'List projects for client company (CLIENT only)' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getProjects(@Param('id') clientId: string, @CurrentUser() user: JwtPayload) {
    return this.clientsService.getProjects(clientId, user);
  }
}
