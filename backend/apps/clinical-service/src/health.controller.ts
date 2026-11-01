import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MESSAGE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_PING)
  ping() {
    const isDbConnected = this.connection.readyState === 1;

    return {
      service: 'clinical-service',
      status: isDbConnected ? 'ok' : 'error',
      database: isDbConnected ? 'connected' : 'disconnected',
      message: 'Microservicio clinico funcionando',
    };
  }
}