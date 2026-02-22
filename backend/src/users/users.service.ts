import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

function omitPassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    if (dto.role === 'CLIENT' && !dto.clientCompanyId) {
      throw new ConflictException('CLIENT role requires clientCompanyId');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        role: dto.role,
        clientCompanyId: dto.clientCompanyId ?? null,
      },
    });
    return omitPassword(user);
  }

  async findAll(query: QueryUsersDto) {
    const { page = 1, limit = 20, role } = query;
    const skip = (page - 1) * limit;
    const where = role ? { role, isActive: true } : { isActive: true };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, isActive: true, clientCompanyId: true, createdAt: true, updatedAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, isActive: true, clientCompanyId: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (existing && existing.id !== id) throw new ConflictException('Email already in use');
    }
    const data: any = {
      ...(dto.name != null && { name: dto.name }),
      ...(dto.email != null && { email: dto.email.toLowerCase() }),
      ...(dto.role != null && { role: dto.role }),
      ...(dto.isActive != null && { isActive: dto.isActive }),
      ...(dto.clientCompanyId !== undefined && { clientCompanyId: dto.clientCompanyId ?? null }),
    };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });
    return omitPassword(updated);
  }

  async updateOwnProfile(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
      if (existing) throw new ConflictException('Email already in use');
    }
    const data: any = {
      ...(dto.name != null && { name: dto.name }),
      ...(dto.email != null && { email: dto.email.toLowerCase() }),
    };
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });
    return omitPassword(updated);
  }


  /** Soft delete: set isActive = false (ADMIN only). */
  async softDelete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { id, isActive: false };
  }
}
