import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

import {
  MESSAGE_PATTERNS,
  PatientProfileReference,
  VaccineResult,
  AppointmentResult,
} from '@app/contracts';

import {
  CreateVaccineInput,
  UpdateVaccineInput,
} from './types/vaccine.graphql';

import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from './types/appointment.graphql';

@Injectable()
export class GraphqlClinicalService {
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
        client.send<T>(pattern, payload).pipe(timeout(5000)),
      );
    } catch (error: unknown) {
      const rpcError = error as {
        statusCode?: number;
        message?: string;
      };

      const message =
        typeof rpcError?.message === 'string'
          ? rpcError.message
          : 'Error de comunicación';

      switch (rpcError?.statusCode) {
        case 400:
          throw new BadRequestException(message);
        case 404:
          throw new NotFoundException(message);
        case 409:
          throw new ConflictException(message);
        default:
          throw new ServiceUnavailableException(
            'Microservicio no disponible',
          );
      }
    }
  }

  private async getPatientId(userId: string): Promise<string> {
    const profile = await this.request<PatientProfileReference>(
      this.identityClient,
      MESSAGE_PATTERNS.IDENTITY_PATIENT_GET,
      userId,
    );

    if (!profile?.id_patient) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }

    return profile.id_patient;
  }

  async vaccines(userId: string) {
    const patientId = await this.getPatientId(userId);

    return this.request<VaccineResult[]>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_VACCINE_LIST,
      patientId,
    );
  }

  async vaccine(userId: string, id: string) {
    const patientId = await this.getPatientId(userId);

    return this.request<VaccineResult>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_VACCINE_GET,
      { patientId, id },
    );
  }

  async createVaccine(userId: string, data: CreateVaccineInput) {
    const patientId = await this.getPatientId(userId);

    return this.request<VaccineResult>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_VACCINE_CREATE,
      { patientId, data },
    );
  }

  async updateVaccine(
    userId: string,
    id: string,
    data: UpdateVaccineInput,
  ) {
    const patientId = await this.getPatientId(userId);

    return this.request<VaccineResult>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_VACCINE_UPDATE,
      { patientId, id, data },
    );
  }

  async deleteVaccine(userId: string, id: string) {
    const patientId = await this.getPatientId(userId);

    return this.request<boolean>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_VACCINE_DELETE,
      { patientId, id },
    );
  }

  async appointments(userId: string) {
    const patientId = await this.getPatientId(userId);

    return this.request<AppointmentResult[]>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_LIST,
      patientId,
    );
  }

  async appointment(userId: string, id: string) {
    const patientId = await this.getPatientId(userId);

    return this.request<AppointmentResult>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_GET,
      { patientId, id },
    );
  }

  async createAppointment(
    userId: string,
    data: CreateAppointmentInput,
  ) {
    const patientId = await this.getPatientId(userId);

    return this.request<AppointmentResult>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_CREATE,
      { patientId, data },
    );
  }

  async updateAppointment(
    userId: string,
    id: string,
    data: UpdateAppointmentInput,
  ) {
    const patientId = await this.getPatientId(userId);

    return this.request<AppointmentResult>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_UPDATE,
      { patientId, id, data },
    );
  }

  async deleteAppointment(userId: string, id: string) {
    const patientId = await this.getPatientId(userId);

    return this.request<boolean>(
      this.clinicalClient,
      MESSAGE_PATTERNS.CLINICAL_APPOINTMENT_DELETE,
      { patientId, id },
    );
  }
}