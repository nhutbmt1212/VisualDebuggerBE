import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

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
}
