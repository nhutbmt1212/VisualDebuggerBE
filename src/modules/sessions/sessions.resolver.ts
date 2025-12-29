import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID, Int, ResolveField, Parent } from '@nestjs/graphql';
import type { User as UserEntity } from '@prisma/client';
import { SessionsService } from './sessions.service';
import { DebugSession } from './models/session.model';
import { PaginatedSessions } from './models/paginated-sessions.model';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => DebugSession)
@UseGuards(GqlAuthGuard)
export class SessionsResolver {
  constructor(private sessionsService: SessionsService) { }

  @ResolveField(() => String, { nullable: true })
  metadata(@Parent() session: any): string | null {
    if (!session.metadata) return null;
    if (typeof session.metadata === 'object') {
      return JSON.stringify(session.metadata);
    }
    return session.metadata;
  }

  @Query(() => PaginatedSessions)
  async sessions(
    @Args('projectId', { type: () => ID }) projectId: string,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @CurrentUser() user: UserEntity,
  ) {
    return this.sessionsService.findAll(projectId, user.id, page, limit);
  }

  @Query(() => PaginatedSessions)
  async recentSessions(
    @CurrentUser() user: UserEntity,
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
  ) {
    return this.sessionsService.findRecent(user.id, page, limit);
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
