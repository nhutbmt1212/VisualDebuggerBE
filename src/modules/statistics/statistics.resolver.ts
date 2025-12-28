import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { User as UserEntity } from '@prisma/client';
import { StatisticsService } from './statistics.service';
import { DashboardStats } from './models/dashboard-stats.model';

@Resolver()
@UseGuards(GqlAuthGuard)
export class StatisticsResolver {
    constructor(private statisticsService: StatisticsService) { }

    @Query(() => DashboardStats)
    async dashboardStats(@CurrentUser() user: UserEntity) {
        return this.statisticsService.getDashboardStats(user.id);
    }
}
