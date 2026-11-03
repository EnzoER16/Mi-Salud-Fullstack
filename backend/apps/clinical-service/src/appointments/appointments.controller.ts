import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type {
  ClinicalCrudById,
  ClinicalCrudPayload,
  ClinicalCrudUpdate,
  AppointmentData,
  UpdateAppointmentData,
} from '@app/contracts';

import { AppointmentsService } from './appointments.service';

@Controller()
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_LIST)
  list(@Payload() patientId: string) {
    return this.service.list(patientId);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_GET)
  get(@Payload() data: ClinicalCrudById) {
    return this.service.get(data.patientId, data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_CREATE)
  create(@Payload() payload: ClinicalCrudPayload<AppointmentData>) {
    return this.service.create(payload.patientId, payload.data);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_UPDATE)
  update(@Payload() payload: ClinicalCrudUpdate<UpdateAppointmentData>) {
    return this.service.update(
      payload.patientId,
      payload.id,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_DELETE)
  remove(@Payload() data: ClinicalCrudById) {
    return this.service.remove(data.patientId, data.id);
  }
}