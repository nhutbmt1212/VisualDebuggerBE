import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DashboardStats } from './models/dashboard-stats.model';

@Injectable()
export class StatisticsService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats(userId: string): Promise<DashboardStats> {
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
            };
        }

        // Total Events
        const totalEvents = await this.prisma.debugEvent.count({
            where: {
                session: {
                    projectId: { in: projectIds },
                },
            },
        });

        // Error Rate
        const errorEvents = await this.prisma.debugEvent.count({
            where: {
                session: { projectId: { in: projectIds } },
                type: 'ERROR',
            },
        });
        const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

        // Avg Latency (for HTTP_REQUEST and FUNCTION_CALL)
        const latencyAgg = await this.prisma.debugEvent.aggregate({
            where: {
                session: { projectId: { in: projectIds } },
                duration: { not: null },
            },
            _avg: {
                duration: true,
            },
        });
        const avgLatency = `${Math.round(latencyAgg._avg.duration || 0)}ms`;

        // Active Sessions (Recent sessions in the last 24 hours)
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const activeSessions = await this.prisma.debugSession.count({
            where: {
                projectId: { in: projectIds },
                startedAt: { gte: twentyFourHoursAgo },
                endedAt: null,
            },
        });

        // Event Frequency (Mocking some data for sparklines - last 7 days)
        const eventFrequency = [120, 150, 200, 180, 250, 300, 280]; // In a real app, this would be grouped by day

        return {
            totalEvents,
            errorRate: parseFloat(errorRate.toFixed(1)),
            avgLatency,
            activeSessions,
            eventFrequency,
        };
    }
}
