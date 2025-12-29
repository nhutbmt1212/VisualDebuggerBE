import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardStats } from './models/dashboard-stats.model';
import { Prisma } from '@prisma/client';

interface DashboardStatsRaw {
  total: number;
  errors: number;
  avg_latency: number | null;
}

interface TrendRaw {
  time_bucket: Date;
  count: number;
}

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(
    userId: string,
    range = '24h',
  ): Promise<DashboardStats> {
    const userProjects = await this.prisma.project.findMany({
      where: { userId },
      select: { id: true },
    });
    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length === 0) {
      return {
        totalEvents: 0,
        errorRate: 0,
        avgLatency: '0ms',
        activeSessions: 0,
        eventFrequency: [],
        trend: [],
        totalEventsChange: 0,
        errorRateChange: 0,
        avgLatencyChange: 0,
        activeSessionsChange: 0,
      };
    }

    const { current, previous } = this.getPeriods(range);

    // Current Stats
    const currentStats = await this.calculateStats(
      projectIds,
      current.start,
      current.end,
    );
    // Previous Stats
    const previousStats = await this.calculateStats(
      projectIds,
      previous.start,
      previous.end,
    );

    // Real Trend Data
    const trend = await this.calculateTrend(projectIds, range);

    return {
      ...currentStats,
      totalEventsChange: this.calcPercentChange(
        currentStats.totalEvents,
        previousStats.totalEvents,
      ),
      errorRateChange: parseFloat(
        (currentStats.errorRate - previousStats.errorRate).toFixed(1),
      ),
      avgLatencyChange:
        parseInt(currentStats.avgLatency) - parseInt(previousStats.avgLatency),
      activeSessionsChange:
        currentStats.activeSessions - previousStats.activeSessions,
      eventFrequency: [120, 150, 200, 180, 250, 300, 280],
      trend,
    };
  }

  async getProjectStats(
    userId: string,
    projectId: string,
    range = '24h',
  ): Promise<DashboardStats> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new Error('Project not found');

    const { current, previous } = this.getPeriods(range);

    // Current Stats
    const currentStats = await this.calculateStats(
      [projectId],
      current.start,
      current.end,
    );
    // Previous Stats
    const previousStats = await this.calculateStats(
      [projectId],
      previous.start,
      previous.end,
    );

    const trend = await this.calculateTrend([projectId], range);

    return {
      ...currentStats,
      totalEventsChange: this.calcPercentChange(
        currentStats.totalEvents,
        previousStats.totalEvents,
      ),
      errorRateChange: parseFloat(
        (currentStats.errorRate - previousStats.errorRate).toFixed(1),
      ),
      avgLatencyChange:
        parseInt(currentStats.avgLatency) - parseInt(previousStats.avgLatency),
      activeSessionsChange:
        currentStats.activeSessions - previousStats.activeSessions,
      eventFrequency: [10, 20, 15, 30, 25, 40, 35],
      trend,
    };
  }

  private getPeriods(range: string) {
    const now = new Date();
    const currentStart = new Date();
    const previousStart = new Date();
    const previousEnd = new Date();

    if (range === '7d') {
      currentStart.setDate(now.getDate() - 7);
      previousEnd.setDate(now.getDate() - 7);
      previousStart.setDate(now.getDate() - 14);
    } else if (range === '30d') {
      currentStart.setDate(now.getDate() - 30);
      previousEnd.setDate(now.getDate() - 30);
      previousStart.setDate(now.getDate() - 60);
    } else {
      currentStart.setHours(now.getHours() - 24);
      previousEnd.setHours(now.getHours() - 24);
      previousStart.setHours(now.getHours() - 48);
    }

    return {
      current: { start: currentStart, end: now },
      previous: { start: previousStart, end: previousEnd },
    };
  }

  private async calculateStats(projectIds: string[], start: Date, end: Date) {
    const stats = await this.prisma.$queryRaw<DashboardStatsRaw[]>`
      SELECT 
        count(*)::int as total,
        count(*) FILTER (WHERE e.type = 'ERROR')::int as errors,
        avg(e.duration) as avg_latency
      FROM debug_events e
      JOIN debug_sessions s ON e.session_id = s.id
      WHERE s.project_id IN (${Prisma.join(projectIds)})
        AND e.timestamp >= ${start} AND e.timestamp <= ${end}
    `;

    const { total: totalEvents, errors: errorEvents, avg_latency } = stats[0];
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
    const avgLatency = `${Math.round(avg_latency || 0)}ms`;

    const activeSessions = await this.prisma.debugSession.count({
      where: {
        projectId: { in: projectIds },
        startedAt: { gte: start, lte: end },
        endedAt: null,
      },
    });

    return {
      totalEvents,
      errorRate: parseFloat(errorRate.toFixed(1)),
      avgLatency,
      activeSessions,
    };
  }

  private calcPercentChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
  }

  private async calculateTrend(projectIds: string[], range: string) {
    const now = new Date();
    const startDate = new Date();
    let interval = 'hour';

    if (range === '7d') {
      startDate.setDate(now.getDate() - 7);
      interval = 'day';
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30);
      interval = 'day';
    } else {
      startDate.setHours(now.getHours() - 24);
      interval = 'hour';
    }

    const results = await this.prisma.$queryRaw<TrendRaw[]>`
      SELECT 
        date_trunc(${interval}, e.timestamp) as time_bucket,
        count(*)::int as count
      FROM debug_events e
      JOIN debug_sessions s ON e.session_id = s.id
      WHERE s.project_id IN (${Prisma.join(projectIds)})
        AND e.timestamp >= ${startDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Fill gaps and format labels
    const counts: Record<string, number> = {};
    const isHourly = interval === 'hour';

    if (isHourly) {
      for (let i = 0; i < 24; i++) {
        const d = new Date(now);
        d.setHours(now.getHours() - i, 0, 0, 0);
        const label = `${d.getHours().toString().padStart(2, '0')}:00`;
        counts[label] = 0;
      }
    } else {
      const days = range === '7d' ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
        counts[label] = 0;
      }
    }

    results.forEach((row) => {
      const d = new Date(row.time_bucket);
      let label: string;
      if (isHourly) {
        label = `${d.getHours().toString().padStart(2, '0')}:00`;
      } else {
        label = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      }
      if (counts[label] !== undefined) {
        counts[label] = row.count;
      }
    });

    return Object.entries(counts)
      .map(([hour, requests]) => ({ hour, requests }))
      .sort((a, b) => {
        if (isHourly) return a.hour.localeCompare(b.hour);
        const [mA, dA] = a.hour.split('/').map(Number);
        const [mB, dB] = b.hour.split('/').map(Number);
        return mA !== mB ? mA - mB : dA - dB;
      });
  }
}
