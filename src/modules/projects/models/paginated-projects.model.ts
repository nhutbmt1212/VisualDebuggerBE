import { ObjectType } from '@nestjs/graphql';
import { Project } from './project.model';
import { Paginated } from '../../../common/dto/pagination.dto';

@ObjectType()
export class PaginatedProjects extends Paginated(Project) {}
