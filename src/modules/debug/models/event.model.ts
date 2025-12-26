import {
  Field,
  ID,
  ObjectType,
  Int,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { DebugSession } from '../../sessions/models/session.model';

@ObjectType()
export class DebugEvent {
  @Field(() => ID)
  id: string;

  @Field()
  sessionId: string;

  @Field({ nullable: true })
  parentEventId?: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  filePath?: string;

  @Field(() => Int, { nullable: true })
  lineNumber?: number;

  @Field(() => Int, { nullable: true })
  columnNumber?: number;

  @Field(() => String, { nullable: true })
  arguments?: string;

  @Field(() => String, { nullable: true })
  returnValue?: string;

  @Field({ nullable: true })
  errorMessage?: string;

  @Field({ nullable: true })
  errorStack?: string;

  @Field({ nullable: true })
  httpMethod?: string;

  @Field({ nullable: true })
  httpUrl?: string;

  @Field(() => Int, { nullable: true })
  httpStatus?: number;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field(() => Int)
  depth: number;

  @Field(() => GraphQLISODateTime)
  timestamp: Date;

  @Field(() => DebugSession)
  session: DebugSession;

  @Field(() => DebugEvent, { nullable: true })
  parentEvent?: DebugEvent;

  @Field(() => [DebugEvent], { nullable: true })
  childEvents?: DebugEvent[];
}
