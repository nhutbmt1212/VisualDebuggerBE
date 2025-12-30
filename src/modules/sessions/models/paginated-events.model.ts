import { ObjectType, Field, Int } from '@nestjs/graphql';
import { DebugEvent } from '../../debug/models/event.model';

@ObjectType()
export class PaginatedEvents {
  @Field(() => [DebugEvent])
  items: DebugEvent[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;
}
