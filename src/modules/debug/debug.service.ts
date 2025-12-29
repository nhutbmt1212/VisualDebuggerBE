import { Injectable } from '@nestjs/common';
import { Prisma, DebugSession, DebugEvent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DebugGateway } from './debug.gateway';
import type { CreateSessionDto, CreateEventDto } from './dto/debug.dto';

@Injectable()
export class DebugService {
  constructor(
    private prisma: PrismaService,
    private gateway: DebugGateway,
  ) {}

  async createSession(
    projectId: string,
    data: CreateSessionDto,
  ): Promise<DebugSession> {
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

  async endSession(id: string): Promise<DebugSession> {
    const session = await this.prisma.debugSession.update({
      where: { id },
      data: { endedAt: new Date() },
    });

    this.gateway.broadcastSessionEnd(session.projectId, session.id);
    return session;
  }

  private async ensureSession(projectId: string, sessionId: string) {
    try {
      await this.prisma.debugSession.upsert({
        where: { id: sessionId },
        update: {},
        create: {
          id: sessionId,
          projectId,
          environment: 'development',
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Record already exists, ignore
        return;
      }
      throw error;
    }
  }

  async createEvent(
    projectId: string,
    data: CreateEventDto,
  ): Promise<DebugEvent> {
    await this.ensureSession(projectId, data.sessionId);

    // Handle parentEventId safely - only link if it exists
    let parentEventId = data.parentEventId || null;
    if (parentEventId) {
      const parentExists = await this.prisma.debugEvent.findUnique({
        where: { id: parentEventId },
      });
      if (!parentExists) {
        parentEventId = null;
      }
    }

    const event = await this.prisma.debugEvent.upsert({
      where: { id: data.id || '' },
      update: {},
      create: {
        id: data.id,
        sessionId: data.sessionId,
        parentEventId: parentEventId,
        type: data.type,
        name: data.name || data.functionName,
        filePath: data.filePath,
        lineNumber: data.lineNumber,
        columnNumber: data.columnNumber,
        arguments: (data.arguments ||
          data.http?.requestBody) as Prisma.JsonObject,
        returnValue: (data.returnValue ||
          data.http?.responseBody) as Prisma.JsonObject,
        errorMessage: data.errorMessage || data.error?.message,
        errorStack: data.errorStack || data.error?.stack,
        httpMethod: data.httpMethod || data.http?.method,
        httpUrl: data.httpUrl || data.http?.url,
        httpStatus: data.httpStatus || data.http?.statusCode,
        duration: data.duration,
        depth: data.depth || 0,
        metadata: data.metadata as Prisma.JsonObject,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      },
      include: {
        session: true,
      },
    });

    this.gateway.broadcastEvent(event.session.projectId, event);
    return event;
  }

  async createEvents(
    projectId: string,
    events: CreateEventDto[],
  ): Promise<DebugEvent[]> {
    // Pre-ensure all unique sessions in the batch
    const sessionIds = [...new Set(events.map((e) => e.sessionId))];
    for (const sid of sessionIds) {
      await this.ensureSession(projectId, sid);
    }

    const results = [];
    for (const eventData of events) {
      results.push(await this.createEvent(projectId, eventData));
    }
    return results;
  }
}
