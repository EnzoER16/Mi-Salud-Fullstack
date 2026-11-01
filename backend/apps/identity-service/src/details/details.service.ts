import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';

import {
  UserRole,
  PatientDetailsInput,
  DoctorDetailsInput,
  PATIENT_DETAILS_FIELDS,
  DOCTOR_DETAILS_FIELDS,
} from '@app/contracts';

import { User } from '../users/schemas/user.schema';
import { PatientProfile } from '../profiles/schemas/patient-profile.schema';
import { DoctorProfile } from '../profiles/schemas/doctor-profile.schema';
import { PatientDetails } from './schemas/patient-details.schema';
import { DoctorDetails } from './schemas/doctor-details.schema';

@Injectable()
export class DetailsService {
  constructor(
    @InjectModel(User.name)
    private readonly users: Model<User>,

    @InjectModel(PatientProfile.name)
    private readonly patients: Model<PatientProfile>,

    @InjectModel(DoctorProfile.name)
    private readonly doctors: Model<DoctorProfile>,

    @InjectModel(PatientDetails.name)
    private readonly patientDetails: Model<PatientDetails>,

    @InjectModel(DoctorDetails.name)
    private readonly doctorDetails: Model<DoctorDetails>,
  ) {}

  private error(statusCode: number, message: string): never {
    throw new RpcException({ statusCode, message });
  }

  private async checkUser(userId: string, role: UserRole) {
    if (!Types.ObjectId.isValid(userId)) {
      this.error(404, 'Usuario no encontrado');
    }

    const user = await this.users.findById(userId).exec();

    if (!user) {
      this.error(404, 'Usuario no encontrado');
    }

    if (user.role !== role) {
      this.error(403, 'No tenés permisos para este recurso');
    }

    return user;
  }

  private async getPatientBase(userId: string) {
    const user = await this.checkUser(userId, UserRole.PATIENT);

    const profile = await this.patients.findOne({
      id_user: userId,
    }).exec();

    if (!profile) {
      this.error(404, 'Perfil de paciente no encontrado');
    }

    return { user, profile };
  }

  private async getDoctorBase(userId: string) {
    const user = await this.checkUser(userId, UserRole.DOCTOR);

    const profile = await this.doctors.findOne({
      id_user: userId,
    }).exec();

    if (!profile) {
      this.error(404, 'Perfil de médico no encontrado');
    }

    return { user, profile };
  }

  private validateBirthDate(value: string | null | undefined) {
    if (!value) return;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      this.error(400, 'Fecha de nacimiento inválida');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const parsed = new Date(Date.UTC(year, month - 1, day));

    const valid =
      year >= 1900 &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day;

    const today = new Date();

    const todayValue =
      today.getFullYear() * 10000 +
      (today.getMonth() + 1) * 100 +
      today.getDate();

    const dateValue = year * 10000 + month * 100 + day;

    if (!valid || dateValue > todayValue) {
      this.error(400, 'Fecha de nacimiento inválida');
    }
  }

  private calculateAge(birthDate: string | null): number | null {
    if (!birthDate) return null;

    const [year, month, day] = birthDate
      .split('-')
      .map(Number);

    const today = new Date();

    let age = today.getFullYear() - year;

    if (
      today.getMonth() + 1 < month ||
      (
        today.getMonth() + 1 === month &&
        today.getDate() < day
      )
    ) {
      age--;
    }

    return age;
  }

  private cleanFields(
    data: Record<string, string | null | undefined>,
    allowed: readonly string[],
  ): Record<string, string | null> {
    const cleaned: Record<string, string | null> = {};

    for (const field of allowed) {
      if (!Object.prototype.hasOwnProperty.call(data, field)) {
        continue;
      }

      const value = data[field];

      if (value === undefined) continue;

      if (value !== null && typeof value !== 'string') {
        this.error(400, `Campo ${field} inválido`);
      }

      cleaned[field] = value === null ? null : value.trim() || null;
    }

    this.validateBirthDate(cleaned.birth_date);

    return cleaned;
  }

  private formatFields(
    document: { toObject(): object } | null,
    fields: readonly string[],
  ): Record<string, string | null> {
    const source = (
      document ? document.toObject() : {}
    ) as Record<string, unknown>;

    const result: Record<string, string | null> = {};

    for (const field of fields) {
      const value = source[field];

      result[field] = typeof value === 'string' ? value : null;
    }

    return result;
  }

  async getPatient(userId: string) {
    const { user, profile } = await this.getPatientBase(userId);

    const document = await this.patientDetails
      .findOne({ id_user: userId })
      .exec();

    const fields = this.formatFields(
      document,
      PATIENT_DETAILS_FIELDS,
    );

    return {
      ...fields,
      age: this.calculateAge(fields.birth_date),
      email: user.email,
      dni: profile.dni,
      address: profile.address,
    };
  }

  async savePatient(userId: string, data: PatientDetailsInput) {
    await this.getPatientBase(userId);

    const cleaned = this.cleanFields(
      data,
      PATIENT_DETAILS_FIELDS,
    );

    await this.patientDetails.findOneAndUpdate(
      { id_user: userId },
      { $set: cleaned },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    return {
      message: 'Datos personales guardados.',
      details: await this.getPatient(userId),
    };
  }

  async getDoctor(userId: string) {
    const { user } = await this.getDoctorBase(userId);

    const document = await this.doctorDetails
      .findOne({ id_user: userId })
      .exec();

    const fields = this.formatFields(
      document,
      DOCTOR_DETAILS_FIELDS,
    );

    return {
      ...fields,
      age: this.calculateAge(fields.birth_date),
      email: user.email,
    };
  }

  async saveDoctor(userId: string, data: DoctorDetailsInput) {
    await this.getDoctorBase(userId);

    const cleaned = this.cleanFields(
      data,
      DOCTOR_DETAILS_FIELDS,
    );

    await this.doctorDetails.findOneAndUpdate(
      { id_user: userId },
      { $set: cleaned },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    return {
      message: 'Datos guardados.',
      details: await this.getDoctor(userId),
    };
  }
}