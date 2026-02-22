import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('services')
@ApiBearerAuth('access-token')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CLIENT)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Get()
  @ApiOperation({ summary: 'List services' })
  @ApiResponse({ status: 200, description: 'List of services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create service (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Service created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update service (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete service (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Service deleted' })
  async remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
