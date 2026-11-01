import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type {
  PatientProfileInput,
  DoctorProfileInput,
  SaveProfilePayload,
} from '@app/contracts';

import { ProfilesService } from './profiles.service';

@Controller()
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_PATIENT_SAVE)
  savePatient(
    @Payload() payload: SaveProfilePayload<PatientProfileInput>,
  ) {
    return this.profilesService.savePatient(
      payload.userId,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_PATIENT_GET)
  getPatient(@Payload() userId: string) {
    return this.profilesService.getPatient(userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_DOCTOR_SAVE)
  saveDoctor(
    @Payload() payload: SaveProfilePayload<DoctorProfileInput>,
  ) {
    return this.profilesService.saveDoctor(
      payload.userId,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_DOCTOR_GET)
  getDoctor(@Payload() userId: string) {
    return this.profilesService.getDoctor(userId);
  }
}