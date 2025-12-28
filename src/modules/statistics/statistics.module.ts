import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsResolver } from './statistics.resolver';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [StatisticsService, StatisticsResolver],
    exports: [StatisticsService],
})
export class StatisticsModule { }
