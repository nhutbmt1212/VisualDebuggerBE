import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ResponseDto<T> {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => String, { nullable: true })
  error?: string;

  data?: T;
}

@ObjectType()
export class PaginationDto {
  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  total: number;

  @Field()
  pages: number;
}
