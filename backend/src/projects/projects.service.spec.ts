import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaService;

  const currentUserId = 'admin-1';
  const projectId = 'proj-1';
  const employeeId = 'emp-1';

  const mockAssignment = {
    id: 'assign-1',
    projectId,
    employeeId,
    assignedAt: new Date(),
    project: { id: projectId, name: 'P', clientId: 'c1', status: 'NOT_STARTED', description: null, createdAt: new Date(), updatedAt: new Date() },
  };

  const mockProject = {
    id: projectId,
    name: 'Project',
    clientId: 'c1',
    status: 'NOT_STARTED',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignments: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            projectEmployee: {
              findFirst: jest.fn(),
              delete: jest.fn(),
            },
            project: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('unassign', () => {
    it('should throw ForbiddenException when unassigning self (employeeId === currentUser.id)', async () => {
      await expect(service.unassign(projectId, currentUserId, currentUserId)).rejects.toThrow(ForbiddenException);
      await expect(service.unassign(projectId, currentUserId, currentUserId)).rejects.toThrow('Cannot unassign yourself');
    });

    it('should throw NotFoundException when assignment does not exist', async () => {
      jest.spyOn(prisma.projectEmployee, 'findFirst').mockResolvedValue(null);

      await expect(service.unassign(projectId, employeeId, currentUserId)).rejects.toThrow(NotFoundException);
    });

    it('should delete assignment and return project when not self-unassign', async () => {
      jest.spyOn(prisma.projectEmployee, 'findFirst').mockResolvedValue(mockAssignment as never);
      jest.spyOn(prisma.projectEmployee, 'delete').mockResolvedValue(mockAssignment as never);
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProject as never);

      const result = await service.unassign(projectId, employeeId, currentUserId);

      expect(prisma.projectEmployee.delete).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });
  });
});
