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
          data: this.serialize(data),
          timestamp: new Date().toISOString(),
        }),
      ),
    );
  }

  private serialize(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map((item) => this.serialize(item));
    if (typeof obj === 'object') {
      if (obj instanceof Date) return obj;
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, this.serialize(value)]),
      );
    }
    return obj;
  }
}
