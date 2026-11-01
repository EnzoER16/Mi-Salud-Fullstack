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
  MedicalRecordResponse,
  PatientProfileReference,
} from '@app/contracts';

import { SaveMedicalRecordDto } from './dto/save-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @Inject('IDENTITY_CLIENT')
    private readonly identityClient: ClientProxy,

    @Inject('CLINICAL_CLIENT')
    private readonly clinicalClient: ClientProxy,
  ) {}

  private async request<T>(
    client: ClientProxy,
    pattern: string,
    payload: unknown,
  ): Promise<T> {
    try {
      return await firstValueFrom(
        client
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
        'No se pudo comunicar con el microservicio',
      );
    }
  }

  private async getPatientId(userId: string): Promise<string> {
    const profile = await this.request<PatientProfileReference>(
      this.identityClient,
      MESSAGE_PATTERNS.IDENTITY_PATIENT_GET,
      userId,
    );

    if (!profile?.id_patient) {
      throw new ServiceUnavailableException(
        'Identity Service no devolvió el identificador del paciente',
      );
    }

    return profile.id_patient;
  }

  async get(userId: string): Promise<MedicalRecordResponse> {
    const patientId = await this.getPatientId(userId);

    return this.request<MedicalRecordResponse>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_RECORD_GET,
      patientId,
    );
  }

  async save(userId: string, data: SaveMedicalRecordDto) {
    const patientId = await this.getPatientId(userId);

    return this.request<{
      message: string;
      medical_record: MedicalRecordResponse;
    }>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_RECORD_SAVE,
      {
        patientId,
        data,
      },
    );
  }
}