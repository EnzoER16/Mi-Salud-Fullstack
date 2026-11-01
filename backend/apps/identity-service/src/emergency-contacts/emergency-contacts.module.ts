import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EmergencyContactsController } from './emergency-contacts.controller';
import { EmergencyContactsService } from './emergency-contacts.service';

import {
  User,
  UserSchema,
} from '../users/schemas/user.schema';

import {
  PatientProfile,
  PatientProfileSchema,
} from '../profiles/schemas/patient-profile.schema';

import {
  EmergencyContact,
  EmergencyContactSchema,
} from './schemas/emergency-contact.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: PatientProfile.name,
        schema: PatientProfileSchema,
      },
      {
        name: EmergencyContact.name,
        schema: EmergencyContactSchema,
      },
    ]),
  ],
  controllers: [EmergencyContactsController],
  providers: [EmergencyContactsService],
})
export class EmergencyContactsModule {}