import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceRequestsService } from './service-requests.service';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;
  let prisma: PrismaService;

  const mockRequest = {
    id: 'req-1',
    clientId: 'client-1',
    serviceId: 'svc-1',
    status: 'PENDING' as RequestStatus,
    details: 'Details here',
    createdAt: new Date(),
    updatedAt: new Date(),
    service: { id: 'svc-1', name: 'Consulting', description: null, price: 100, createdAt: new Date(), updatedAt: new Date() },
    client: { id: 'client-1', name: 'Acme Inc', createdAt: new Date(), updatedAt: new Date() },
  };

  const mockProject = {
    id: 'proj-1',
    name: 'Consulting for Acme Inc',
    description: 'Details here',
    clientId: 'client-1',
    status: 'NOT_STARTED',
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: 'client-1', name: 'Acme Inc', createdAt: new Date(), updatedAt: new Date() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        {
          provide: PrismaService,
          useValue: {
            serviceRequest: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            project: { create: jest.fn() },
            $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => {
              const tx = {
                serviceRequest: { update: jest.fn().mockResolvedValue(undefined) },
                project: { create: jest.fn().mockResolvedValue(mockProject) },
              };
              return fn(tx);
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ServiceRequestsService>(ServiceRequestsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('approve', () => {
    it('should run update + create in a single transaction and return created project', async () => {
      jest.spyOn(prisma, 'serviceRequest').mockReturnValue({
        findUnique: jest.fn().mockResolvedValue(mockRequest),
      } as never);
      const transactionSpy = jest.spyOn(prisma, '$transaction').mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          serviceRequest: { update: jest.fn().mockResolvedValue(undefined) },
          project: { create: jest.fn().mockResolvedValue(mockProject) },
        };
        return fn(tx) as Promise<typeof mockProject>;
      });

      const result = await service.approve('req-1');

      expect(transactionSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProject);
      expect(result.name).toBe('Consulting for Acme Inc');
      expect(result.description).toBe('Details here');
      expect(result.clientId).toBe('client-1');
    });

    it('should throw NotFoundException when request does not exist', async () => {
      jest.spyOn(prisma, 'serviceRequest').mockReturnValue({
        findUnique: jest.fn().mockResolvedValue(null),
      } as never);

      await expect(service.approve('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when request already approved', async () => {
      jest.spyOn(prisma, 'serviceRequest').mockReturnValue({
        findUnique: jest.fn().mockResolvedValue({ ...mockRequest, status: 'APPROVED' }),
      } as never);

      await expect(service.approve('req-1')).rejects.toThrow(BadRequestException);
    });
  });
});
