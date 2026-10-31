
import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { MESSAGE_PATTERNS } from '@app/contracts';

interface HealthResponse {
  service: string;
  status: string;
  message: string;
}

@Controller('health')
export class HealthController {
  constructor(
    @Inject('IDENTITY_CLIENT')
    private readonly identityClient: ClientProxy,

    @Inject('CLINICAL_CLIENT')
    private readonly clinicalClient: ClientProxy,
  ) {}

  @Get()
  async checkHealth() {
    try {
      const [identity, clinical] = await Promise.all([
        firstValueFrom(
          this.identityClient
            .send<HealthResponse>(
              MESSAGE_PATTERNS.IDENTITY_PING,
              {},
            )
            .pipe(timeout(3000)),
        ),

        firstValueFrom(
          this.clinicalClient
            .send<HealthResponse>(
              MESSAGE_PATTERNS.CLINICAL_PING,
              {},
            )
            .pipe(timeout(3000)),
        ),
      ]);

      return {
        gateway: 'ok',
        services: {
          identity,
          clinical,
        },
      };
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo establecer comunicacion con todos los microservicios',
      );
    }
  }
}
