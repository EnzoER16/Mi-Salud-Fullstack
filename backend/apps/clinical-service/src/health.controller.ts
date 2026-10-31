import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MESSAGE_PATTERNS } from '@app/contracts';

@Controller()
export class HealthController {
  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_PING)
  ping() {
    return {
      service: 'clinical-service',
      status: 'ok',
      message: 'Microservicio clinico funcionando',
    };
  }
}