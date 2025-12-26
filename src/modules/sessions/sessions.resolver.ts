import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import type { User as UserEntity } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { DebugSession } from './models/session.model';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => DebugSession)
@UseGuards(GqlAuthGuard)
export class SessionsResolver {
  constructor(private sessionsService: SessionsService) {}

  @Query(() => [DebugSession])
  async sessions(
    @Args('projectId', { type: () => ID }) projectId: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.sessionsService.findAll(projectId, user.id);
  }

  @Query(() => DebugSession)
  async session(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.sessionsService.findOne(id, user.id);
  }

  @Mutation(() => DebugSession)
  async deleteSession(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.sessionsService.delete(id, user.id);
  }
}
