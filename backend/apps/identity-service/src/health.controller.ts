import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthController {
  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_PING)
  ping() {
    return {
      service: 'identity-service',
      status: 'ok',
      message: 'Microservicio de usuarios funcionando',
    };
  }
}