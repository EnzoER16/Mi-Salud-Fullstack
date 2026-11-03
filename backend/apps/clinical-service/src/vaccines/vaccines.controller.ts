import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type {
  ClinicalCrudById,
  ClinicalCrudPayload,
  ClinicalCrudUpdate,
  VaccineData,
  UpdateVaccineData,
} from '@app/contracts';

import { VaccinesService } from './vaccines.service';

@Controller()
export class VaccinesController {
  constructor(private readonly service: VaccinesService) {}

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_VACCINE_LIST)
  list(@Payload() patientId: string) {
    return this.service.list(patientId);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_VACCINE_GET)
  get(@Payload() data: ClinicalCrudById) {
    return this.service.get(data.patientId, data.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_VACCINE_CREATE)
  create(@Payload() payload: ClinicalCrudPayload<VaccineData>) {
    return this.service.create(payload.patientId, payload.data);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_VACCINE_UPDATE)
  update(@Payload() payload: ClinicalCrudUpdate<UpdateVaccineData>) {
    return this.service.update(
      payload.patientId,
      payload.id,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_VACCINE_DELETE)
  remove(@Payload() data: ClinicalCrudById) {
    return this.service.remove(data.patientId, data.id);
  }
}