import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T> | T> {
    const type = context.getType();
    if (type === 'rpc' || (type as string) === 'graphql') {
      return next.handle() as Observable<T>;
    }

    return next.handle().pipe(
      map(
        (data: T): SuccessResponse<T> => ({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        }),
      ),
    );
  }
}
