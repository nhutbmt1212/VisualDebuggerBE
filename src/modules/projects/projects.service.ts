import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.input';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';

interface ProjectTrendRaw {
  projectId: string;
  time_bucket: Date;
  count: number;
}

interface SingleProjectTrendRaw {
  time_bucket: Date;
  count: number;
}

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

    // Calculate trend for each project using optimized Raw SQL
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const projectIds = items.map((p) => p.id);
    const trendResults =
      projectIds.length > 0
        ? await this.prisma.$queryRaw<ProjectTrendRaw[]>`
          SELECT 
            s.project_id as "projectId",
            date_trunc('hour', e.timestamp) as time_bucket,
            count(*)::int as count
          FROM debug_events e
          JOIN debug_sessions s ON e.session_id = s.id
          WHERE s.project_id IN (${Prisma.join(projectIds)})
            AND e.timestamp >= ${twentyFourHoursAgo}
          GROUP BY 1, 2
        `
        : [];

    const now = new Date();
    const itemsWithTrend = items.map((project) => {
      const hourlyCounts = new Array(24).fill(0);

      const projectTrends = trendResults.filter(
        (r) => r.projectId === project.id,
      );

      projectTrends.forEach((row) => {
        const diffMs = now.getTime() - new Date(row.time_bucket).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours >= 0 && diffHours < 24) {
          hourlyCounts[23 - diffHours] = row.count;
        }
      });

      return {
        ...project,
        activityTrend: hourlyCounts,
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items: itemsWithTrend,
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

    // Calculate trend for single project
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const trendResults = await this.prisma.$queryRaw<SingleProjectTrendRaw[]>`
      SELECT 
        date_trunc('hour', timestamp) as time_bucket,
        count(*)::int as count
      FROM debug_events
      WHERE session_id IN (
        SELECT id FROM debug_sessions WHERE project_id = ${project.id}
      )
        AND timestamp >= ${twentyFourHoursAgo}
      GROUP BY 1
    `;

    const hourlyCounts = new Array(24).fill(0);
    const now = new Date();

    trendResults.forEach((row) => {
      const diffMs = now.getTime() - new Date(row.time_bucket).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours >= 0 && diffHours < 24) {
        hourlyCounts[23 - diffHours] = row.count;
      }
    });

    return {
      ...project,
      activityTrend: hourlyCounts,
    };
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
