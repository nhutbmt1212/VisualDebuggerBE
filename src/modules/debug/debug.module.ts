import { Module } from '@nestjs/common';
import { DebugService } from './debug.service';
import { DebugController } from './debug.controller';
import { DebugGateway } from './debug.gateway';

@Module({
  providers: [DebugService, DebugGateway],
  controllers: [DebugController],
})
export class DebugModule {}
