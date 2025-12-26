import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ProjectsService', () => {
    let service: ProjectsService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        project: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProjectsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<ProjectsService>(ProjectsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all projects for a user', async () => {
            const mockProjects = [
                {
                    id: '1',
                    name: 'Project 1',
                    description: 'Description 1',
                    apiKey: 'key1',
                    userId: 'user1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPrismaService.project.findMany.mockResolvedValue(mockProjects);

            const result = await service.findAll('user1');

            expect(result).toEqual(mockProjects);
            expect(mockPrismaService.project.findMany).toHaveBeenCalledWith({
                where: { userId: 'user1' },
                include: { user: true },
            });
        });
    });

    describe('findOne', () => {
        it('should return a project if user owns it', async () => {
            const mockProject = {
                id: '1',
                name: 'Project 1',
                userId: 'user1',
                apiKey: 'key1',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.project.findFirst.mockResolvedValue(mockProject);

            const result = await service.findOne('1', 'user1');

            expect(result).toEqual(mockProject);
            expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
                where: { id: '1', userId: 'user1' },
                include: { user: true },
            });
        });

        it('should throw NotFoundException if project not found', async () => {
            mockPrismaService.project.findFirst.mockResolvedValue(null);

            await expect(service.findOne('1', 'user1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('should create a project with a generated API key', async () => {
            const createInput = {
                name: 'New Project',
                description: 'Description',
            };

            const mockCreatedProject = {
                id: '1',
                ...createInput,
                userId: 'user1',
                apiKey: expect.stringMatching(/^vd_/),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.project.create.mockResolvedValue(mockCreatedProject);

            const result = await service.create('user1', createInput);

            expect(result).toEqual(mockCreatedProject);
            expect(mockPrismaService.project.create).toHaveBeenCalledWith({
                data: {
                    ...createInput,
                    userId: 'user1',
                    apiKey: expect.stringMatching(/^vd_/),
                },
                include: { user: true },
            });
        });
    });

    describe('regenerateApiKey', () => {
        it('should regenerate API key for owned project', async () => {
            const mockProject = {
                id: '1',
                userId: 'user1',
                apiKey: 'old-key',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockUpdatedProject = {
                ...mockProject,
                apiKey: 'vd_newkey',
            };

            mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
            mockPrismaService.project.update.mockResolvedValue(mockUpdatedProject);

            const result = await service.regenerateApiKey('1', 'user1');

            expect(result.apiKey).toMatch(/^vd_/);
            expect(result.apiKey).not.toBe('old-key');
            expect(mockPrismaService.project.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { apiKey: expect.stringMatching(/^vd_/) },
                include: { user: true },
            });
        });
    });
});
