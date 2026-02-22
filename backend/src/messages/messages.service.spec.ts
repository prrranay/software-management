import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let prisma: PrismaService;

  const adminId = 'admin-1';
  const employeeId = 'emp-1';
  const clientId = 'client-1';
  const otherClientId = 'client-2';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn(), findMany: jest.fn() },
            message: { create: jest.fn() },
            projectEmployee: { findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create (messaging permission checks)', () => {
    it('should throw NotFoundException when receiver does not exist', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create(adminId, { receiverId: 'nonexistent', content: 'Hi' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when employee messages client with no shared project', async () => {
      jest
        .spyOn(prisma.user, 'findUnique')
        .mockImplementation((args: { where: { id: string } }) => {
          const id = args.where.id;
          if (id === employeeId) return Promise.resolve({ id: employeeId, role: Role.EMPLOYEE, clientCompanyId: null } as never);
          if (id === clientId) return Promise.resolve({ id: clientId, role: Role.CLIENT, clientCompanyId: 'company-1' } as never);
          return Promise.resolve(null);
        });
      jest.spyOn(prisma.projectEmployee, 'findFirst').mockResolvedValue(null);

      await expect(
        service.create(employeeId, { receiverId: clientId, content: 'Hi' }),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create(employeeId, { receiverId: clientId, content: 'Hi' }),
      ).rejects.toThrow('not allowed to message this user');
    });

    it('should allow admin to message any user', async () => {
      const receiver = { id: clientId, name: 'Client', email: 'c@x.com', role: Role.CLIENT, isActive: true, clientCompanyId: 'co1', password: '', createdAt: new Date(), updatedAt: new Date() };
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(receiver as never);
      jest.spyOn(prisma.message, 'create').mockResolvedValue({
        id: 'msg-1',
        senderId: adminId,
        receiverId: clientId,
        content: 'Hi',
        createdAt: new Date(),
        sender: { id: adminId, name: 'Admin', email: 'a@x.com' },
        receiver: { id: clientId, name: 'Client', email: 'c@x.com' },
      } as never);

      const result = await service.create(adminId, { receiverId: clientId, content: 'Hi' });

      expect(prisma.message.create).toHaveBeenCalled();
      expect(result.receiverId).toBe(clientId);
    });
  });
});
