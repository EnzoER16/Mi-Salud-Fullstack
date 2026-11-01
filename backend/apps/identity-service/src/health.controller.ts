import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MESSAGE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_PING)
  ping() {
    const isDbConnected = this.connection.readyState === 1;

    return {
      service: 'identity-service',
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : 'disconnected',
      message: 'Microservicio de usuarios funcionando',
    };
  }
}