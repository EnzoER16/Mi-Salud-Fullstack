import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { MESSAGE_PATTERNS } from '@app/contracts';
import type {
  ContactOwnerPayload,
  CreateContactPayload,
  ContactByIdPayload,
  UpdateContactPayload,
} from '@app/contracts';

import { EmergencyContactsService } from './emergency-contacts.service';

@Controller()
export class EmergencyContactsController {
  constructor(
    private readonly contactsService: EmergencyContactsService,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_CONTACT_LIST)
  list(@Payload() payload: ContactOwnerPayload) {
    return this.contactsService.list(payload.userId);
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_CONTACT_CREATE)
  create(@Payload() payload: CreateContactPayload) {
    return this.contactsService.create(
      payload.userId,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_CONTACT_UPDATE)
  update(@Payload() payload: UpdateContactPayload) {
    return this.contactsService.update(
      payload.userId,
      payload.contactId,
      payload.data,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.IDENTITY_CONTACT_DELETE)
  remove(@Payload() payload: ContactByIdPayload) {
    return this.contactsService.remove(
      payload.userId,
      payload.contactId,
    );
  }
}