import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import type { User as UserEntity } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { Project } from './models/project.model';
import { CreateProjectInput, UpdateProjectInput } from './dto/project.input';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { PaginatedProjects } from './models/paginated-projects.model';
import { PaginationArgs } from '../../common/dto/pagination.args';

@Resolver(() => Project)
@UseGuards(GqlAuthGuard)
export class ProjectsResolver {
  constructor(private projectsService: ProjectsService) {}

  @Query(() => PaginatedProjects)
  async projects(
    @CurrentUser() user: UserEntity,
    @Args() paginationArgs: PaginationArgs,
  ) {
    return this.projectsService.findAll(
      user.id,
      paginationArgs.page,
      paginationArgs.limit,
    );
  }

  @Query(() => Project)
  async project(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectsService.findOne(id, user.id);
  }

  @Mutation(() => Project)
  async createProject(
    @Args('input') input: CreateProjectInput,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectsService.create(user.id, input);
  }

  @Mutation(() => Project)
  async updateProject(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateProjectInput,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectsService.update(id, user.id, input);
  }

  @Mutation(() => Project)
  async deleteProject(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectsService.delete(id, user.id);
  }

  @Mutation(() => Project)
  async regenerateProjectKey(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.projectsService.regenerateApiKey(id, user.id);
  }
}
