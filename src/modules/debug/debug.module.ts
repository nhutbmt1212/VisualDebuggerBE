import { Module } from '@nestjs/common';
import { DebugService } from './debug.service';
import { DebugController } from './debug.controller';
import { DebugGateway } from './debug.gateway';

import { DebugResolver } from './debug.resolver';

@Module({
  providers: [DebugService, DebugGateway, DebugResolver],
  controllers: [DebugController],
})
export class DebugModule {}
