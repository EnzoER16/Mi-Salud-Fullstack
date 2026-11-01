import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type {
  DetailsPayload,
  PatientDetailsInput,
  DoctorDetailsInput,
} from '@app/contracts';

import { DetailsService } from './details.service';

@Controller()
export class DetailsController {
  constructor(private readonly detailsService: DetailsService) {}

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_PATIENT_DETAILS_GET)
  getPatient(@Payload() userId: string) {
    return this.detailsService.getPatient(userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_PATIENT_DETAILS_SAVE)
  savePatient(
    @Payload() payload: DetailsPayload<PatientDetailsInput>,
  ) {
    return this.detailsService.savePatient(
      payload.userId,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_DOCTOR_DETAILS_GET)
  getDoctor(@Payload() userId: string) {
    return this.detailsService.getDoctor(userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_DOCTOR_DETAILS_SAVE)
  saveDoctor(
    @Payload() payload: DetailsPayload<DoctorDetailsInput>,
  ) {
    return this.detailsService.saveDoctor(
      payload.userId,
      payload.data,
    );
  }
}