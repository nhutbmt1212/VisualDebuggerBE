import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.input';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
      this.prisma.project.count({
        where: { userId },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      totalCount,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
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
