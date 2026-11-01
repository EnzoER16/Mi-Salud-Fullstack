import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InternalClientsModule } from '../clients/clients.module';

import { ProfilesService } from './profiles.service';
import { PatientController } from './patient.controller';
import { DoctorController } from './doctor.controller';

@Module({
  imports: [
    AuthModule,
    InternalClientsModule,
  ],
  controllers: [
    PatientController,
    DoctorController,
  ],
  providers: [ProfilesService],
})
export class ProfilesModule {}