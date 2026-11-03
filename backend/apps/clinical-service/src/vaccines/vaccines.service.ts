import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model, Types, HydratedDocument } from 'mongoose';

import {
  VaccineData,
  UpdateVaccineData,
  VaccineResult,
} from '@app/contracts';

import { Vaccine } from './schemas/vaccine.schema';

@Injectable()
export class VaccinesService {
  constructor(
    @InjectModel(Vaccine.name)
    private readonly vaccines: Model<Vaccine>,
  ) {}

  private fail(statusCode: number, message: string): never {
    throw new RpcException({ statusCode, message });
  }

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      this.fail(400, 'Identificador inválido');
    }
  }

  private validateDay(value: string | null | undefined) {
    if (!value) return;

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
      this.fail(400, 'La fecha debe tener formato YYYY-MM-DD');
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      year < 1900 ||
      year > 2100 ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      this.fail(400, 'Fecha inválida');
    }
  }

  private clean(data: UpdateVaccineData) {
    const result: Record<string, string | null> = {};

    const limits: Record<string, number> = {
      name: 100,
      dose: 40,
      applied_on: 10,
      next_dose_on: 10,
      place: 100,
      notes: 255,
    };

    for (const [field, limit] of Object.entries(limits)) {
      if (!Object.prototype.hasOwnProperty.call(data, field)) {
        continue;
      }

      const value = (data as Record<string, unknown>)[field];

      if (value !== null && typeof value !== 'string') {
        this.fail(400, `El campo ${field} no es válido`);
      }

      const normalized = value === null ? null : value.trim();

      if (normalized !== null && normalized.length > limit) {
        this.fail(400, `El campo ${field} es demasiado largo`);
      }

      if (field === 'name' && !normalized) {
        this.fail(400, 'El nombre de la vacuna es obligatorio');
      }

      result[field] = normalized || null;
    }

    this.validateDay(result.applied_on);
    this.validateDay(result.next_dose_on);

    return result;
  }

  private checkDates(
    applied: string | null,
    next: string | null,
  ) {
    if (applied && applied > new Date().toISOString().slice(0, 10)) {
      this.fail(400, 'La aplicación no puede tener fecha futura');
    }

    if (applied && next && next <= applied) {
      this.fail(400, 'El refuerzo debe ser posterior a la aplicación');
    }
  }

  private format(
    item: HydratedDocument<Vaccine>,
  ): VaccineResult {
    return {
      id_vaccine: item._id.toString(),
      name: item.name,
      dose: item.dose ?? null,
      applied_on: item.applied_on ?? null,
      next_dose_on: item.next_dose_on ?? null,
      place: item.place ?? null,
      notes: item.notes ?? null,
    };
  }

  async list(patientId: string): Promise<VaccineResult[]> {
    this.validateId(patientId);

    const items = await this.vaccines
      .find({ id_patient: patientId })
      .exec();

    return items
      .sort((a, b) => {
        if (!a.applied_on && b.applied_on) return 1;
        if (a.applied_on && !b.applied_on) return -1;
        return (b.applied_on ?? '').localeCompare(a.applied_on ?? '');
      })
      .map(item => this.format(item));
  }

  async get(patientId: string, id: string): Promise<VaccineResult> {
    this.validateId(id);

    const item = await this.vaccines.findOne({
      _id: id,
      id_patient: patientId,
    }).exec();

    if (!item) this.fail(404, 'Vacuna no encontrada');

    return this.format(item);
  }

  async create(patientId: string, data: VaccineData) {
    this.validateId(patientId);

    const cleaned = this.clean(data);

    if (!cleaned.name) {
      this.fail(400, 'El nombre de la vacuna es obligatorio');
    }

    this.checkDates(
      cleaned.applied_on ?? null,
      cleaned.next_dose_on ?? null,
    );

    const count = await this.vaccines.countDocuments({
      id_patient: patientId,
    });

    if (count >= 150) {
      this.fail(400, 'Se permiten hasta 150 vacunas');
    }

    const item = await this.vaccines.create({
      id_patient: patientId,
      ...cleaned,
    });

    return this.format(item);
  }

  async update(
    patientId: string,
    id: string,
    data: UpdateVaccineData,
  ) {
    this.validateId(id);

    const existing = await this.vaccines.findOne({
      _id: id,
      id_patient: patientId,
    }).exec();

    if (!existing) this.fail(404, 'Vacuna no encontrada');

    const cleaned = this.clean(data);

    const applied =
      cleaned.applied_on !== undefined
        ? cleaned.applied_on
        : existing.applied_on;

    const next =
      cleaned.next_dose_on !== undefined
        ? cleaned.next_dose_on
        : existing.next_dose_on;

    this.checkDates(applied, next);

    const updated = await this.vaccines.findOneAndUpdate(
      { _id: id, id_patient: patientId },
      { $set: cleaned },
      { new: true, runValidators: true },
    ).exec();

    if (!updated) this.fail(404, 'Vacuna no encontrada');

    return this.format(updated);
  }

  async remove(patientId: string, id: string): Promise<boolean> {
    this.validateId(id);

    const result = await this.vaccines.findOneAndDelete({
      _id: id,
      id_patient: patientId,
    }).exec();

    if (!result) this.fail(404, 'Vacuna no encontrada');

    return true;
  }
}