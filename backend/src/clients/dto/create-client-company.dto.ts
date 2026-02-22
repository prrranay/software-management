import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateClientCompanyDto {
    @ApiProperty({ example: 'Acme Corp' })
    @IsString()
    @MinLength(2)
    name!: string;
}
