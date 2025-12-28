import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export function Paginated<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef])
    items: T[];

    @Field(() => Int)
    totalCount: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    totalPages: number;

    @Field(() => Boolean)
    hasNextPage: boolean;

    @Field(() => Boolean)
    hasPreviousPage: boolean;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return PaginatedType as any;
}

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
