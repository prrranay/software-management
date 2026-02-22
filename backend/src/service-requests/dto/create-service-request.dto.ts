import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'Service ID' })
  @IsUUID()
  serviceId!: string;

  @ApiProperty({ description: 'Client company ID (must match authenticated client user)' })
  @IsUUID()
  clientId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  details?: string;
}
