import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, RefreshResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
@ApiBearerAuth('access-token')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto, examples: { default: { value: { email: 'admin@example.com', password: 'Admin123!' } } } })
  @ApiResponse({ status: 201, description: 'Login successful', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: LoginDto,
  ) {
    const { accessToken, user, refreshToken } = await this.authService.login(body.email, body.password);
    return { accessToken, refreshToken, user };
  }

  @Public()
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Refresh access token using HttpOnly cookie' })
  @ApiResponse({
    status: 200,
    description: 'New access token',
    schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } },
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh cookie' })
  async refresh(@Req() req: Request & { user: { sub: string; email: string } }) {
    const result = await this.authService.refresh(req.user);
    return result;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clear refresh token cookie' })
  @ApiResponse({ status: 204, description: 'Cookie cleared' })
  async logout() {
    // With pure token architecture, logout is mostly handled client-side.
    // Future: blacklisting tokens if strictly required.
    return;
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user',
    schema: {
      example: { id: 'uuid', name: 'Admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, clientCompanyId: null },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async profile(@CurrentUser() payload: JwtPayload) {
    return this.authService.getProfile(payload.sub);
  }
}
