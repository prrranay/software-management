import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessagesDto } from './dto/query-messages.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth('access-token')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @Post()
  @ApiOperation({ summary: 'Send a message (allowed pairs: Admin↔any; Employee↔Admin; Employee↔Client/Client↔Employee on same project)' })
  @ApiBody({ schema: { example: { receiverId: 'uuid-user', content: 'Hello, when is the next meeting?' } } })
  @ApiResponse({ status: 201, description: 'Message created' })
  @ApiResponse({ status: 403, description: 'Not allowed to message this user' })
  @ApiResponse({ status: 404, description: 'Receiver not found' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(user.sub, dto);
  }

  @Get('partners')
  @ApiOperation({ summary: 'Get list of users you can chat with' })
  @ApiResponse({ status: 200, description: 'List of chat partners' })
  async getChatPartners(@CurrentUser() user: JwtPayload) {
    return this.messagesService.getChatPartners(user);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated conversation with peer (query: peerId, page, limit)' })
  @ApiResponse({ status: 200, description: 'Paginated messages with peer' })
  @ApiResponse({ status: 403, description: 'Not allowed to view this conversation' })
  async getConversation(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryMessagesDto,
  ) {
    return this.messagesService.getConversation(user.sub, query);
  }
}
