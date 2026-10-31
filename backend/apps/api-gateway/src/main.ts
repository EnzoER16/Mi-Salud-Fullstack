import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todos los endpoints HTTP comienzan con /api
  app.setGlobalPrefix('api');

  // Permitimos futuras peticiones desde React
  app.enableCors({
    origin: 'http://localhost:5173',
  });

  await app.listen(3000);

  console.log('API Gateway disponible en http://localhost:3000');
}

bootstrap();