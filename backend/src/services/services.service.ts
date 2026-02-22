import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
    return this.prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        price: new Decimal(dto.price),
      },
    });
  }

  async update(id: string, dto: UpdateServiceDto) {
    const data: any = { ...dto };
    if (dto.price) data.price = new Decimal(dto.price);

    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
