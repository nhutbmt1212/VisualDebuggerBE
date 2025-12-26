import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUsersService = {
        findOne: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            const registerInput = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            };

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                passwordHash: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUsersService.findOne.mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
            mockUsersService.create.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('jwt-token');

            const result = await service.register(registerInput);

            expect(result).toEqual({
                accessToken: 'jwt-token',
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                    createdAt: mockUser.createdAt,
                    updatedAt: mockUser.updatedAt,
                },
            });
            expect(mockUsersService.findOne).toHaveBeenCalledWith('test@example.com');
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
            expect(mockUsersService.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            const registerInput = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Test User',
            };

            mockUsersService.findOne.mockResolvedValue({
                id: '1',
                email: 'existing@example.com',
            });

            await expect(service.register(registerInput)).rejects.toThrow(
                ConflictException,
            );
            expect(mockUsersService.findOne).toHaveBeenCalledWith(
                'existing@example.com',
            );
        });
    });

    describe('login', () => {
        it('should successfully login with valid credentials', async () => {
            const loginInput = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                passwordHash: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUsersService.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('jwt-token');

            const result = await service.login(loginInput);

            expect(result).toEqual({
                accessToken: 'jwt-token',
                user: {
                    id: '1',
                    email: 'test@example.com',
                    name: 'Test User',
                    createdAt: mockUser.createdAt,
                    updatedAt: mockUser.updatedAt,
                },
            });
            expect(bcrypt.compare).toHaveBeenCalledWith(
                'password123',
                'hashedPassword',
            );
        });

        it('should throw UnauthorizedException if user not found', async () => {
            const loginInput = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            mockUsersService.findOne.mockResolvedValue(null);

            await expect(service.login(loginInput)).rejects.toThrow(
                UnauthorizedException,
            );
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            const loginInput = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUsersService.findOne.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginInput)).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    describe('validateUser', () => {
        it('should return user by ID', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                passwordHash: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockUsersService.findById.mockResolvedValue(mockUser);

            const result = await service.validateUser('1');

            expect(result).toEqual(mockUser);
            expect(mockUsersService.findById).toHaveBeenCalledWith('1');
        });
    });
});
