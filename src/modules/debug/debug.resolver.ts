import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import type { DebugEvent as PrismaDebugEvent } from '@prisma/client';
import { DebugEvent } from './models/event.model';

@Resolver(() => DebugEvent)
export class DebugResolver {
  @ResolveField(() => String, { nullable: true })
  arguments(@Parent() event: PrismaDebugEvent): string | null {
    if (!event.arguments) return null;
    if (typeof event.arguments === 'object') {
      return JSON.stringify(event.arguments);
    }
    return event.arguments as unknown as string;
  }

  @ResolveField(() => String, { nullable: true })
  returnValue(@Parent() event: PrismaDebugEvent): string | null {
    if (!event.returnValue) return null;
    if (typeof event.returnValue === 'object') {
      return JSON.stringify(event.returnValue);
    }
    return event.returnValue as unknown as string;
  }
}
