import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type { MedicalRecordSavePayload } from '@app/contracts';

import { MedicalRecordsService } from './medical-records.service';

@Controller()
export class MedicalRecordsController {
  constructor(
    private readonly recordsService: MedicalRecordsService,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_RECORD_GET)
  get(@Payload() patientId: string) {
    return this.recordsService.get(patientId);
  }

  @MessagePattern(MESSAGE_PATTERNS.CLINICAL_RECORD_SAVE)
  save(@Payload() payload: MedicalRecordSavePayload) {
    return this.recordsService.save(
      payload.patientId,
      payload.data,
    );
  }
}