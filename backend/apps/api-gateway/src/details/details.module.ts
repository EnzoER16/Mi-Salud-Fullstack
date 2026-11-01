import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InternalClientsModule } from '../clients/clients.module';

import { DetailsService } from './details.service';
import { PatientDetailsController } from './patient-details.controller';
import { DoctorDetailsController } from './doctor-details.controller';

@Module({
  imports: [
    AuthModule,
    InternalClientsModule,
  ],
  controllers: [
    PatientDetailsController,
    DoctorDetailsController,
  ],
  providers: [DetailsService],
})
export class DetailsModule {}