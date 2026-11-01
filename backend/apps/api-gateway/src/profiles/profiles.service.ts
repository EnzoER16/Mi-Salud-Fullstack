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
} from '@app/contracts';

import { PatientProfileDto } from './dto/patient-profile.dto';
import { DoctorProfileDto } from './dto/doctor-profile.dto';

@Injectable()
export class ProfilesService {
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
        'Servicio de perfiles no disponible',
      );
    }
  }

  savePatient(userId: string, data: PatientProfileDto) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_PATIENT_SAVE,
      { userId, data },
    );
  }

  getPatient(userId: string) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_PATIENT_GET,
      userId,
    );
  }

  saveDoctor(userId: string, data: DoctorProfileDto) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_DOCTOR_SAVE,
      { userId, data },
    );
  }

  getDoctor(userId: string) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_DOCTOR_GET,
      userId,
    );
  }
}