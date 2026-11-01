import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InternalClientsModule } from '../clients/clients.module';

import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';

@Module({
  imports: [
    AuthModule,
    InternalClientsModule,
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
})
export class MedicalRecordsModule {}