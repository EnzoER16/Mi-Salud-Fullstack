import {
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

import { MESSAGE_PATTERNS } from '@app/contracts';

import { PatientDetailsDto } from './dto/patient-details.dto';
import { DoctorDetailsDto } from './dto/doctor-details.dto';

@Injectable()
export class DetailsService {
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
        'Servicio de datos personales no disponible',
      );
    }
  }

  getPatient(userId: string) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_PATIENT_DETAILS_GET,
      userId,
    );
  }

  savePatient(userId: string, data: PatientDetailsDto) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_PATIENT_DETAILS_SAVE,
      { userId, data },
    );
  }

  getDoctor(userId: string) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_DOCTOR_DETAILS_GET,
      userId,
    );
  }

  saveDoctor(userId: string, data: DoctorDetailsDto) {
    return this.request(
      MESSAGE_PATTERNS.IDENTITY_DOCTOR_DETAILS_SAVE,
      { userId, data },
    );
  }
}