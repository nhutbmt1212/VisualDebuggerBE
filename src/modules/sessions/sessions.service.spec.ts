import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

describe('SessionsService', () => {
    let service: SessionsService;
    let prismaService: PrismaService;
    let projectsService: ProjectsService;

    const mockPrismaService = {
        project: {
            findFirst: jest.fn(),
        },
        debugSession: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    };

    const mockProjectsService = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SessionsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: ProjectsService,
                    useValue: mockProjectsService,
                },
            ],
        }).compile();

        service = module.get<SessionsService>(SessionsService);
        prismaService = module.get<PrismaService>(PrismaService);
        projectsService = module.get<ProjectsService>(ProjectsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all sessions for a project owned by user', async () => {
            const mockProject = {
                id: 'project1',
                userId: 'user1',
                apiKey: 'key1',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockSessions = [
                {
                    id: 'session1',
                    projectId: 'project1',
                    environment: 'development',
                    startedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            mockPrismaService.project.findFirst.mockResolvedValue(mockProject);
            mockPrismaService.debugSession.findMany.mockResolvedValue(mockSessions);

            const result = await service.findAll('project1', 'user1');

            expect(result).toEqual(mockSessions);
            expect(mockPrismaService.project.findFirst).toHaveBeenCalledWith({
                where: { id: 'project1', userId: 'user1' },
            });
            expect(mockPrismaService.debugSession.findMany).toHaveBeenCalledWith({
                where: { projectId: 'project1' },
                orderBy: { startedAt: 'desc' },
                include: { project: true },
            });
        });
    });

    describe('findOne', () => {
        it('should return a session if user owns the project', async () => {
            const mockSession = {
                id: 'session1',
                projectId: 'project1',
                environment: 'development',
                startedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                project: {
                    id: 'project1',
                    userId: 'user1',
                    apiKey: 'key1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };

            mockPrismaService.debugSession.findUnique.mockResolvedValue(mockSession);

            const result = await service.findOne('session1', 'user1');

            expect(result).toEqual(mockSession);
            expect(mockPrismaService.debugSession.findUnique).toHaveBeenCalledWith({
                where: { id: 'session1' },
                include: {
                    project: true,
                    events: {
                        orderBy: { timestamp: 'asc' },
                        include: { childEvents: true },
                    },
                },
            });
        });

        it('should throw NotFoundException if session not found', async () => {
            mockPrismaService.debugSession.findUnique.mockResolvedValue(null);

            await expect(service.findOne('session1', 'user1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('delete', () => {
        it('should delete a session if user owns the project', async () => {
            const mockSession = {
                id: 'session1',
                projectId: 'project1',
                environment: 'development',
                startedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                project: {
                    id: 'project1',
                    userId: 'user1',
                    apiKey: 'key1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            };

            mockPrismaService.debugSession.findUnique.mockResolvedValue(mockSession);
            mockPrismaService.debugSession.delete.mockResolvedValue(mockSession);

            const result = await service.delete('session1', 'user1');

            expect(result).toEqual(mockSession);
            expect(mockPrismaService.debugSession.delete).toHaveBeenCalledWith({
                where: { id: 'session1' },
            });
        });
    });
});
