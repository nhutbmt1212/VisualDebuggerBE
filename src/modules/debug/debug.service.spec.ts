import { Test, TestingModule } from '@nestjs/testing';
import { DebugService } from './debug.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DebugGateway } from './debug.gateway';

describe('DebugService', () => {
    let service: DebugService;
    let prismaService: PrismaService;
    let debugGateway: DebugGateway;

    const mockPrismaService = {
        debugSession: {
            create: jest.fn(),
            update: jest.fn(),
        },
        debugEvent: {
            create: jest.fn(),
        },
    };

    const mockDebugGateway = {
        broadcastSession: jest.fn(),
        broadcastEvent: jest.fn(),
        broadcastSessionEnd: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DebugService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
                {
                    provide: DebugGateway,
                    useValue: mockDebugGateway,
                },
            ],
        }).compile();

        service = module.get<DebugService>(DebugService);
        prismaService = module.get<PrismaService>(PrismaService);
        debugGateway = module.get<DebugGateway>(DebugGateway);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSession', () => {
        it('should create a session and broadcast it', async () => {
            const sessionData = {
                environment: 'production',
                userAgent: 'Mozilla/5.0',
                ipAddress: '127.0.0.1',
                metadata: { key: 'value' },
            };

            const mockSession = {
                id: 'session1',
                projectId: 'project1',
                ...sessionData,
                startedAt: new Date(),
                endedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.debugSession.create.mockResolvedValue(mockSession);

            const result = await service.createSession('project1', sessionData);

            expect(result).toEqual(mockSession);
            expect(mockPrismaService.debugSession.create).toHaveBeenCalledWith({
                data: {
                    projectId: 'project1',
                    environment: 'production',
                    userAgent: 'Mozilla/5.0',
                    ipAddress: '127.0.0.1',
                    metadata: { key: 'value' },
                },
            });
            expect(mockDebugGateway.broadcastSession).toHaveBeenCalledWith(
                'project1',
                mockSession,
            );
        });
    });

    describe('endSession', () => {
        it('should end a session and broadcast the end', async () => {
            const mockSession = {
                id: 'session1',
                projectId: 'project1',
                environment: 'development',
                startedAt: new Date(),
                endedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.debugSession.update.mockResolvedValue(mockSession);

            const result = await service.endSession('session1');

            expect(result).toEqual(mockSession);
            expect(mockPrismaService.debugSession.update).toHaveBeenCalledWith({
                where: { id: 'session1' },
                data: { endedAt: expect.any(Date) },
            });
            expect(mockDebugGateway.broadcastSessionEnd).toHaveBeenCalledWith(
                'project1',
                'session1',
            );
        });
    });

    describe('createEvent', () => {
        it('should create an event and broadcast it', async () => {
            const eventData = {
                sessionId: 'session1',
                type: 'FUNCTION_CALL',
                name: 'testFunction',
                filePath: '/test.ts',
                lineNumber: 10,
                columnNumber: 5,
                arguments: { arg1: 'value' },
                returnValue: { result: 'success' },
                duration: 100,
                depth: 0,
                metadata: {},
            };

            const mockEvent = {
                id: 'event1',
                ...eventData,
                session: {
                    projectId: 'project1',
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.debugEvent.create.mockResolvedValue(mockEvent);

            const result = await service.createEvent(eventData);

            expect(result).toEqual(mockEvent);
            expect(mockDebugGateway.broadcastEvent).toHaveBeenCalledWith(
                'project1',
                mockEvent,
            );
        });
    });

    describe('createEvents', () => {
        it('should create multiple events', async () => {
            const eventsData = [
                {
                    sessionId: 'session1',
                    type: 'FUNCTION_CALL',
                    name: 'func1',
                    filePath: '/test.ts',
                    lineNumber: 10,
                },
                {
                    sessionId: 'session1',
                    type: 'FUNCTION_CALL',
                    name: 'func2',
                    filePath: '/test.ts',
                    lineNumber: 20,
                },
            ];

            const mockEvent = {
                id: 'event1',
                session: { projectId: 'project1' },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrismaService.debugEvent.create.mockResolvedValue(mockEvent);

            const result = await service.createEvents(eventsData);

            expect(result).toHaveLength(2);
            expect(mockPrismaService.debugEvent.create).toHaveBeenCalledTimes(2);
        });
    });
});
