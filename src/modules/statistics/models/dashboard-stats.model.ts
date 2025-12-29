import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { TrendData } from './trend-data.model';

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalEvents: number;

  @Field(() => Float)
  errorRate: number;

  @Field(() => String)
  avgLatency: string;

  @Field(() => Int)
  activeSessions: number;

  @Field(() => [Int])
  eventFrequency: number[];

  @Field(() => [TrendData])
  trend: TrendData[];

  @Field(() => Float)
  totalEventsChange: number;

  @Field(() => Float)
  errorRateChange: number;

  @Field(() => Float)
  avgLatencyChange: number;

  @Field(() => Float)
  activeSessionsChange: number;
}
