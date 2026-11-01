import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { DetailsController } from './details.controller';
import { DetailsService } from './details.service';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import {
  PatientProfile,
  PatientProfileSchema,
} from '../profiles/schemas/patient-profile.schema';

import {
  DoctorProfile,
  DoctorProfileSchema,
} from '../profiles/schemas/doctor-profile.schema';

import {
  PatientDetails,
  PatientDetailsSchema,
} from './schemas/patient-details.schema';

import {
  DoctorDetails,
  DoctorDetailsSchema,
} from './schemas/doctor-details.schema';

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
      {
        name: PatientDetails.name,
        schema: PatientDetailsSchema,
      },
      {
        name: DoctorDetails.name,
        schema: DoctorDetailsSchema,
      },
    ]),
  ],
  controllers: [DetailsController],
  providers: [DetailsService],
})
export class DetailsModule {}