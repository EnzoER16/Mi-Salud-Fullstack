import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthController } from './health.controller';
import { MedicalRecordsModule } from './medical-records/medical-records.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>(
          'MONGO_CLINICAL_URI',
        ),
        serverSelectionTimeoutMS: 5000,
      }),
    }),

    MedicalRecordsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class ClinicalServiceModule {}