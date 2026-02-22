import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'uuid' })
  id!: string;
  @ApiProperty({ example: 'Admin' })
  name!: string;
  @ApiProperty({ example: 'admin@example.com' })
  email!: string;
  @ApiProperty({ enum: ['ADMIN', 'EMPLOYEE', 'CLIENT'] })
  role!: string;
  @ApiProperty()
  isActive!: boolean;
  @ApiProperty({ nullable: true })
  clientCompanyId!: string | null;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token for Authorization header', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;
  @ApiProperty({ type: UserProfileDto, example: { id: 'uuid', name: 'Admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, clientCompanyId: null } })
  user!: UserProfileDto;
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken!: string;
}
