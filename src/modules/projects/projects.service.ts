import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.input';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      include: { user: true },
    });
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { user: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(userId: string, input: CreateProjectInput) {
    const apiKey = `vd_${uuidv4().replace(/-/g, '')}`;
    return this.prisma.project.create({
      data: {
        ...input,
        apiKey,
        userId,
      },
      include: { user: true },
    });
  }

  async update(id: string, userId: string, input: UpdateProjectInput) {
    await this.findOne(id, userId);
    return this.prisma.project.update({
      where: { id },
      data: input,
      include: { user: true },
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.project.delete({ where: { id } });
  }

  async regenerateApiKey(id: string, userId: string) {
    await this.findOne(id, userId);
    const apiKey = `vd_${uuidv4().replace(/-/g, '')}`;
    return this.prisma.project.update({
      where: { id },
      data: { apiKey },
      include: { user: true },
    });
  }
}
