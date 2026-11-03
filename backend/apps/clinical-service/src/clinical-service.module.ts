import { WorkflowsModule } from './workflows/workflows.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthController } from './health.controller';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { VaccinesModule } from './vaccines/vaccines.module';
import { AppointmentsModule } from './appointments/appointments.module';

@Module({
  imports: [
    WorkflowsModule,
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
    VaccinesModule,
    AppointmentsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class ClinicalServiceModule {}