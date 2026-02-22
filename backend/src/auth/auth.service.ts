import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UserProfileDto } from './dto/auth-response.dto';

const REFRESH_COOKIE_NAME = 'refreshToken';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: UserProfileDto; refreshToken: string }> {
    if (!email || typeof email !== 'string') {
      throw new UnauthorizedException('Invalid email or password');
    }
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_TTL ?? '15m',
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_TTL ?? '7d',
      },
    );
    const userProfile = this.toProfile(user);
    return {
      accessToken,
      user: userProfile,
      refreshToken, // controller will set cookie and remove from body
    };
  }

  async refresh(refreshPayload: { sub: string; email: string }): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: refreshPayload.sub },
    });
    if (!user || !user.isActive) {
      throw new ForbiddenException('User not found or inactive');
    }
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_TTL ?? '15m',
    });
    return { accessToken };
  }

  async validateAccessPayload(payload: JwtPayload): Promise<{ sub: string; email: string; role: Role }> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return { sub: user.id, email: user.email, role: user.role };
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return this.toProfile(user);
  }

  getRefreshCookieName(): string {
    return REFRESH_COOKIE_NAME;
  }

  getRefreshCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; maxAge: number; path: string } {
    const ttl = process.env.REFRESH_TOKEN_TTL ?? '7d';
    const maxAge = this.parseTtlToSeconds(ttl);
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge,
      path: '/',
    };
  }

  getLogoutCookieOptions(): { httpOnly: boolean; secure: boolean; sameSite: 'lax' | 'strict' | 'none'; path: string; maxAge: number } {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 0,
    };
  }

  private toProfile(user: { id: string; name: string; email: string; role: Role; isActive: boolean; clientCompanyId: string | null }): UserProfileDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      clientCompanyId: user.clientCompanyId,
    };
  }

  private parseTtlToSeconds(ttl: string): number {
    const match = ttl.trim().match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 7 * 24 * 60 * 60; // default 7 days
    const [, num, unit] = match;
    const n = parseInt(num!, 10);
    switch (unit) {
      case 's': return n;
      case 'm': return n * 60;
      case 'h': return n * 60 * 60;
      case 'd': return n * 24 * 60 * 60;
      default: return 7 * 24 * 60 * 60;
    }
  }
}
