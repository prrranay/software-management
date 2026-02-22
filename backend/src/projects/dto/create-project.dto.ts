import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectDto {
    @ApiProperty({ example: 'Mobile App Development' })
    @IsString()
    name!: string;

    @ApiProperty({ required: false, example: 'Build a cross-platform mobile app' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'The client company ID' })
    @IsUUID()
    clientId!: string;
}
