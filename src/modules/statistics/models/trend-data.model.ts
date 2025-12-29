import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class TrendData {
  @Field(() => String)
  hour: string;

  @Field(() => Int)
  requests: number;
}
