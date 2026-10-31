import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';

import { IdentityServiceModule } from './identity-service.module';

async function bootstrap() {
  const app =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      IdentityServiceModule,
      {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 4001,
        },
      },
    );

  await app.listen();

  console.log('Identity Service escuchando en puerto 4001');
}

bootstrap();