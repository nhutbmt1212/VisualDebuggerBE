import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { DebugSession, DebugEvent } from '@prisma/client';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/debug',
})
export class DebugGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    void client.join(`project:${projectId}`);
    return { success: true };
  }

  broadcastSession(projectId: string, session: DebugSession) {
    this.server.to(`project:${projectId}`).emit('new_session', session);
  }

  broadcastEvent(projectId: string, event: DebugEvent) {
    this.server.to(`project:${projectId}`).emit('new_event', event);
  }

  broadcastSessionEnd(projectId: string, sessionId: string) {
    this.server.to(`project:${projectId}`).emit('session_ended', { sessionId });
  }
}
