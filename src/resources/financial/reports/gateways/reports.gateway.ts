import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtWsAuthGuard } from 'src/common/guards/jwt-ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  handlePreflightRequest: (req, res) => {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
  },
})
@UseGuards(JwtWsAuthGuard)
export class ReportsGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any, ...args: any[]) {
    const authToken = client.handshake?.headers?.authorization?.split(' ')[1];
    if (!authToken) {
      client.disconnect();
      console.log('Client disconnected due to missing token:', client.id);
      return;
    }
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }

  @UseGuards(JwtWsAuthGuard)
  @SubscribeMessage('events')
  findAll(@MessageBody() data: any): Observable<WsResponse<number>> {
    return from([1, 2, 3]).pipe(
      map((item) => ({ event: 'events', data: item })),
    );
  }

  @UseGuards(JwtWsAuthGuard)
  @SubscribeMessage('identity')
  async identity(@MessageBody() data: number): Promise<number> {
    return data;
  }
}
