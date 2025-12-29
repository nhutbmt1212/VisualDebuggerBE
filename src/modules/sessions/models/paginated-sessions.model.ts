import { ObjectType } from '@nestjs/graphql';
import { DebugSession } from './session.model';
import { Paginated } from '../../../common/dto/pagination.dto';

@ObjectType()
export class PaginatedSessions extends Paginated(DebugSession) {}
