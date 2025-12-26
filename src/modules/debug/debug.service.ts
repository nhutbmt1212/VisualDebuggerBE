import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DebugGateway } from './debug.gateway';
import type { CreateSessionDto, CreateEventDto } from './dto/debug.dto';

@Injectable()
export class DebugService {
  constructor(
    private prisma: PrismaService,
    private gateway: DebugGateway,
  ) {}

  async createSession(projectId: string, data: CreateSessionDto) {
    const session = await this.prisma.debugSession.create({
      data: {
        projectId,
        environment: data.environment || 'development',
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        metadata: data.metadata as Prisma.JsonObject,
      },
    });

    this.gateway.broadcastSession(projectId, session);
    return session;
  }

  async endSession(id: string) {
    const session = await this.prisma.debugSession.update({
      where: { id },
      data: { endedAt: new Date() },
    });

    this.gateway.broadcastSessionEnd(session.projectId, session.id);
    return session;
  }

  async createEvent(data: CreateEventDto) {
    const event = await this.prisma.debugEvent.create({
      data: {
        sessionId: data.sessionId,
        parentEventId: data.parentEventId || null,
        type: data.type,
        name: data.name,
        filePath: data.filePath,
        lineNumber: data.lineNumber,
        columnNumber: data.columnNumber,
        arguments: data.arguments as Prisma.JsonObject,
        returnValue: data.returnValue as Prisma.JsonObject,
        errorMessage: data.errorMessage,
        errorStack: data.errorStack,
        httpMethod: data.httpMethod,
        httpUrl: data.httpUrl,
        httpStatus: data.httpStatus,
        duration: data.duration,
        depth: data.depth || 0,
        metadata: data.metadata as Prisma.JsonObject,
      },
      include: {
        session: true,
      },
    });

    this.gateway.broadcastEvent(event.session.projectId, event);
    return event;
  }

  async createEvents(events: CreateEventDto[]) {
    const results = [];
    for (const eventData of events) {
      results.push(await this.createEvent(eventData));
    }
    return results;
  }
}
