import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

import { User, UserSchema } from '../users/schemas/user.schema';
import {
  PatientProfile,
  PatientProfileSchema,
} from './schemas/patient-profile.schema';
import {
  DoctorProfile,
  DoctorProfileSchema,
} from './schemas/doctor-profile.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: PatientProfile.name,
        schema: PatientProfileSchema,
      },
      {
        name: DoctorProfile.name,
        schema: DoctorProfileSchema,
      },
    ]),
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}