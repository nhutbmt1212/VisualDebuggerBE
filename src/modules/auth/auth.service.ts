import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { User as UserEntity } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RegisterInput, LoginInput } from './dto/auth.input';
import { AuthResponse } from './models/auth-response.model';
import { User } from '../users/models/user.model';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private mapToUser(user: UserEntity): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user: this.mapToUser(user) };
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

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user: this.mapToUser(user) };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
