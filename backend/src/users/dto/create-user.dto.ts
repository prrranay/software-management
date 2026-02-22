import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password!: string;

  @ApiProperty({ enum: ['ADMIN', 'EMPLOYEE', 'CLIENT'] })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ required: false, description: 'Required when role is CLIENT' })
  @IsOptional()
  @IsString()
  clientCompanyId?: string;
}
