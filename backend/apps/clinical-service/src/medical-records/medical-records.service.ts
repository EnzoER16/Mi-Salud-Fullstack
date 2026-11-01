import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import {
  HydratedDocument,
  Model,
  Types,
} from 'mongoose';

import {
  BLOOD_GROUPS,
  MedicalRecordInput,
  MedicalRecordResponse,
} from '@app/contracts';

import { MedicalRecord } from './schemas/medical-record.schema';

const TEXT_FIELDS: Record<string, number> = {
  blood_group: 20,
  allergies: 2000,
  antecedents: 2000,
  intolerances: 2000,
  surgeries: 2000,
  family_history: 2000,
  current_medication: 2000,
  last_checkup: 10,
  last_dental_checkup: 10,
  primary_doctor_name: 100,
  primary_doctor_phone: 25,
  care_center: 120,
};

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectModel(MedicalRecord.name)
    private readonly records: Model<MedicalRecord>,
  ) {}

  private fail(statusCode: number, message: string): never {
    throw new RpcException({ statusCode, message });
  }

  private validatePatientId(patientId: string) {
    if (!Types.ObjectId.isValid(patientId)) {
      this.fail(400, 'Identificador de paciente inválido');
    }
  }

  private validateDay(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      this.fail(400, 'La fecha debe tener formato YYYY-MM-DD');
    }

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    const valid =
      year >= 1900 &&
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === month - 1 &&
      parsed.getUTCDate() === day;

    const now = new Date();
    const todayValue =
      now.getFullYear() * 10000 +
      (now.getMonth() + 1) * 100 +
      now.getDate();

    if (!valid || year * 10000 + month * 100 + day > todayValue) {
      this.fail(400, 'La fecha no es válida o es futura');
    }
  }

  private cleanData(
    data: MedicalRecordInput,
  ): Record<string, unknown> {
    const source = data as Record<string, unknown>;
    const cleaned: Record<string, unknown> = {};

    for (const [field, maxLength] of Object.entries(TEXT_FIELDS)) {
      if (!Object.prototype.hasOwnProperty.call(source, field)) {
        continue;
      }

      const value = source[field];

      if (value === null || value === '') {
        cleaned[field] = null;
        continue;
      }

      if (typeof value !== 'string') {
        this.fail(400, `El campo ${field} debe ser un texto`);
      }

      const text = value.trim();

      if (text.length > maxLength) {
        this.fail(400, `El campo ${field} es demasiado largo`);
      }

      if (
        field === 'blood_group' &&
        !BLOOD_GROUPS.some(group => group === text)
      ) {
        this.fail(400, 'Grupo sanguíneo inválido');
      }

      if (
        field === 'last_checkup' ||
        field === 'last_dental_checkup'
      ) {
        if (text) this.validateDay(text);
      }

      if (field === 'primary_doctor_phone' && text) {
        const digits = text.replace(/\D/g, '');
        if (
          !/^[0-9+()\s-]+$/.test(text) ||
          digits.length < 6 ||
          digits.length > 15
        ) {
          this.fail(400, 'Teléfono del médico inválido');
        }
      }

      cleaned[field] = text || null;
    }

    for (const field of ['weight_kg', 'height_cm']) {
      if (!Object.prototype.hasOwnProperty.call(source, field)) {
        continue;
      }

      const value = source[field];

      if (value === null || value === '') {
        cleaned[field] = null;
        continue;
      }

      const numeric =
        typeof value === 'string'
          ? Number(value.replace(',', '.'))
          : value;

      if (typeof numeric !== 'number' || !Number.isFinite(numeric)) {
        this.fail(400, `El campo ${field} debe ser numérico`);
      }

      const min = field === 'weight_kg' ? 1 : 30;
      const max = field === 'weight_kg' ? 500 : 260;

      if (
        numeric < min ||
        numeric > max ||
        (field === 'height_cm' && !Number.isInteger(numeric))
      ) {
        this.fail(400, `El campo ${field} está fuera de rango`);
      }

      cleaned[field] =
        field === 'weight_kg'
          ? Math.round(numeric * 10) / 10
          : numeric;
    }

    if (Object.prototype.hasOwnProperty.call(source, 'conditions')) {
      const value = source.conditions;

      if (value === null) {
        cleaned.conditions = [];
      } else {
        if (!Array.isArray(value)) {
          this.fail(400, 'Las condiciones deben ser una lista');
        }

        const conditions: string[] = [];

        for (const condition of value) {
          if (typeof condition !== 'string') {
            this.fail(400, 'Condición crónica inválida');
          }

          const name = condition.trim();

          if (name.length > 60) {
            this.fail(400, 'Una condición supera 60 caracteres');
          }

          if (name && !conditions.includes(name)) {
            conditions.push(name);
          }
        }

        if (conditions.length > 20) {
          this.fail(400, 'Se permiten hasta 20 condiciones');
        }

        cleaned.conditions = conditions;
      }
    }

    if (Object.prototype.hasOwnProperty.call(source, 'wears_glasses')) {
      const value = source.wears_glasses;

      if (value !== null && typeof value !== 'boolean') {
        this.fail(400, 'El campo wears_glasses debe ser booleano');
      }

      cleaned.wears_glasses = value;
    }

    return cleaned;
  }

  private toResponse(
    record: HydratedDocument<MedicalRecord>,
  ): MedicalRecordResponse {
    const weight = record.weight_kg;
    const height = record.height_cm;

    const bmi =
      weight !== null &&
      weight !== undefined &&
      height !== null &&
      height !== undefined &&
      height > 0
        ? Math.round(
            (weight / Math.pow(height / 100, 2)) * 10,
          ) / 10
        : null;

    return {
      id_record: record._id.toString(),
      id_patient: record.id_patient,

      blood_group: record.blood_group ?? null,
      allergies: record.allergies ?? null,
      antecedents: record.antecedents ?? null,

      weight_kg: weight ?? null,
      height_cm: height ?? null,
      bmi,
      conditions: record.conditions ?? [],

      intolerances: record.intolerances ?? null,
      surgeries: record.surgeries ?? null,
      family_history: record.family_history ?? null,
      current_medication: record.current_medication ?? null,

      wears_glasses: record.wears_glasses ?? null,

      last_checkup: record.last_checkup ?? null,
      last_dental_checkup: record.last_dental_checkup ?? null,

      primary_doctor_name: record.primary_doctor_name ?? null,
      primary_doctor_phone: record.primary_doctor_phone ?? null,
      care_center: record.care_center ?? null,
    };
  }

  async get(patientId: string): Promise<MedicalRecordResponse> {
    this.validatePatientId(patientId);

    const record = await this.records
      .findOne({ id_patient: patientId })
      .exec();

    if (!record) {
      this.fail(404, 'Aún no has creado tu ficha médica.');
    }

    return this.toResponse(record);
  }

  async save(patientId: string, data: MedicalRecordInput) {
    this.validatePatientId(patientId);

    const cleaned = this.cleanData(data);

    const existed = await this.records.exists({
      id_patient: patientId,
    });

    const record = await this.records.findOneAndUpdate(
      { id_patient: patientId },
      {
        $set: cleaned,
        $setOnInsert: { id_patient: patientId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    if (!record) {
      this.fail(500, 'No se pudo guardar la ficha médica');
    }

    return {
      message: existed
        ? 'Ficha médica actualizada correctamente'
        : 'Ficha médica creada correctamente',
      medical_record: this.toResponse(record),
    };
  }
}