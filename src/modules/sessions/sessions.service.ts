import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string, userId: string) {
    // Verify project belongs to user
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    return this.prisma.debugSession.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' },
      include: { project: true },
    });
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
}
