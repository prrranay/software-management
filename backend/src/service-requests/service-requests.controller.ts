import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ServiceRequestsService } from './service-requests.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('service-requests')
@ApiBearerAuth('access-token')
@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) { }

  @Get()
  @ApiOperation({ summary: 'List service requests (ADMIN sees all, CLIENT sees own company requests)' })
  @ApiResponse({ status: 200, description: 'List of service requests' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.serviceRequestsService.findAll(user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Create a service request (CLIENT only)' })
  @ApiBody({ schema: { example: { serviceId: 'uuid-service', details: 'Need implementation by Q2' } } })
  @ApiResponse({ status: 201, description: 'Service request created', schema: { example: { id: 'uuid', clientId: 'uuid', serviceId: 'uuid', status: 'PENDING', details: 'Need implementation by Q2', createdAt: '2024-02-22T12:00:00Z', service: { id: 'uuid', name: 'Consulting' }, client: { id: 'uuid', name: 'Acme Inc' } } } })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.create(user, dto);
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Approve a service request (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Returns created Project (transaction: request approved + project created)' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async approve(@Param('id') id: string) {
    return this.serviceRequestsService.approve(id);
  }
}
