import {
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

import {
  MESSAGE_PATTERNS,
  EmergencyContactResponse,
} from '@app/contracts';

import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';

@Injectable()
export class EmergencyContactsService {
  constructor(
    @Inject('IDENTITY_CLIENT')
    private readonly identityClient: ClientProxy,
  ) {}

  private async request<T>(
    pattern: string,
    payload: unknown,
  ): Promise<T> {
    try {
      return await firstValueFrom(
        this.identityClient
          .send<T>(pattern, payload)
          .pipe(timeout(5000)),
      );
    } catch (error: unknown) {
      const rpcError = error as {
        statusCode?: number;
        message?: string;
      };

      if (
        typeof rpcError?.statusCode === 'number' &&
        rpcError.statusCode >= 400 &&
        rpcError.statusCode < 500
      ) {
        throw new HttpException(
          rpcError.message || 'Solicitud inválida',
          rpcError.statusCode,
        );
      }

      throw new ServiceUnavailableException(
        'Servicio de contactos no disponible',
      );
    }
  }

  list(userId: string) {
    return this.request<EmergencyContactResponse[]>(
      MESSAGE_PATTERNS.IDENTITY_CONTACT_LIST,
      { userId },
    );
  }

  create(userId: string, data: CreateEmergencyContactDto) {
    return this.request<EmergencyContactResponse>(
      MESSAGE_PATTERNS.IDENTITY_CONTACT_CREATE,
      { userId, data },
    );
  }

  update(
    userId: string,
    contactId: string,
    data: UpdateEmergencyContactDto,
  ) {
    return this.request<EmergencyContactResponse>(
      MESSAGE_PATTERNS.IDENTITY_CONTACT_UPDATE,
      { userId, contactId, data },
    );
  }

  remove(userId: string, contactId: string) {
    return this.request<{ message: string }>(
      MESSAGE_PATTERNS.IDENTITY_CONTACT_DELETE,
      { userId, contactId },
    );
  }
}