import { Field, ID, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';
import { Project } from '../../projects/models/project.model';

@ObjectType()
export class DebugSession {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  environment: string;

  @Field({ nullable: true })
  userAgent?: string;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field(() => String, { nullable: true })
  metadata?: string;

  @Field(() => GraphQLISODateTime)
  startedAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  endedAt?: Date;

  @Field(() => Project)
  project: Project;
}
