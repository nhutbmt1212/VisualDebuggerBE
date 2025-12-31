import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { User as UserEntity } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput, LoginInput } from './dto/auth.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { AuthResponse } from './models/auth-response.model';
import { User } from '../users/models/user.model';

@Injectable()
export class AuthService {
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresInDays: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.accessTokenExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    this.refreshTokenExpiresInDays = parseInt(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') || '7',
      10,
    );
  }

  private mapToUser(user: UserEntity): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      plan: user.plan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private generateAccessToken(user: UserEntity): string {
    return this.jwtService.sign(
      { sub: user.id, email: user.email },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      { expiresIn: this.accessTokenExpiresIn as any },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.usersService.findOne(input.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.usersService.create({
      email: input.email,
      passwordHash,
      name: input.name,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.mapToUser(user) };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.usersService.findOne(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken, user: this.mapToUser(user) };
  }

  async refreshTokens(input: RefreshTokenInput): Promise<AuthResponse> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Revoke the old token (token rotation for security)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const accessToken = this.generateAccessToken(storedToken.user);
    const refreshToken = await this.generateRefreshToken(storedToken.user.id);

    return {
      accessToken,
      refreshToken,
      user: this.mapToUser(storedToken.user),
    };
  }

  async logout(input: RefreshTokenInput): Promise<boolean> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: input.refreshToken },
    });

    if (storedToken && !storedToken.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
    }

    return true;
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
      },
    });
    return result.count;
  }
}
