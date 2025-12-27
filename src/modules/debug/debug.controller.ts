import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import type { Request } from 'express';
import { DebugService } from './debug.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import type { CreateSessionDto, CreateEventDto } from './dto/debug.dto';

@Controller('api')
@UseGuards(ApiKeyGuard)
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  @Post('session')
  async createSession(@Req() req: Request, @Body() body: CreateSessionDto) {
    if (!req.project) {
      throw new Error('Project not found on request');
    }
    return this.debugService.createSession(req.project.id, body);
  }

  @Patch('session/:id')
  async endSession(@Param('id') id: string) {
    return this.debugService.endSession(id);
  }

  @Post('events')
  async createEvents(@Body() events: CreateEventDto[]) {
    return this.debugService.createEvents(events);
  }

  @Post('event')
  async createEvent(@Body() body: CreateEventDto) {
    return this.debugService.createEvent(body);
  }
}
