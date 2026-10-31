import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';

import { ClinicalServiceModule } from './clinical-service.module';

async function bootstrap() {
  const app =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      ClinicalServiceModule,
      {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4002,
        },
      },
    );

  await app.listen();

  console.log('Clinical Service escuchando en puerto 4002');
}

bootstrap();