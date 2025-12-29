import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, userId: string, page = 1, limit = 10) {
    // Verify project belongs to user
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const skip = (page - 1) * limit;

    const [items, totalCount] = await this.prisma.$transaction([
      this.prisma.debugSession.findMany({
        where: { projectId },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip,
        include: {
          project: true,
          events: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
        },
      }),
      this.prisma.debugSession.count({
        where: { projectId },
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
    const session = await this.prisma.debugSession.findUnique({
      where: { id },
      include: {
        project: true,
        events: {
          orderBy: { timestamp: 'asc' },
          include: { childEvents: true },
        },
      },
    });

    if (!session || session.project.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.debugSession.delete({ where: { id } });
  }

  async findRecent(userId: string, page = 1, limit = 5) {
    const skip = (page - 1) * limit;

    const [items, totalCount] = await this.prisma.$transaction([
      this.prisma.debugSession.findMany({
        where: {
          project: { userId },
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip,
        include: {
          project: true,
          events: {
            take: 1,
            orderBy: { timestamp: 'desc' },
          },
        },
      }),
      this.prisma.debugSession.count({
        where: {
          project: { userId },
        },
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
}
