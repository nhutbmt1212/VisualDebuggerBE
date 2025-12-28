import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsOptional, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @Min(1)
  limit?: number = 10;
}
