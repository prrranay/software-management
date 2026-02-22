import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Receiver user ID' })
  @IsUUID()
  receiverId!: string;

  @ApiProperty({ example: 'Hello, when is the next meeting?' })
  @IsString()
  @MinLength(1)
  content!: string;
}
