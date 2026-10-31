import { NestFactory } from '@nestjs/core';
import { ClinicalServiceModule } from './clinical-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ClinicalServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
