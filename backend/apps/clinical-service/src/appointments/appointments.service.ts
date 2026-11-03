import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { HydratedDocument, Model, Types } from 'mongoose';

import {
  AppointmentData,
  UpdateAppointmentData,
  AppointmentResult,
} from '@app/contracts';

import { Appointment } from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointments: Model<Appointment>,
  ) {}

  private fail(statusCode: number, message: string): never {
    throw new RpcException({ statusCode, message });
  }

  private validateId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      this.fail(400, 'Identificador inválido');
    }
  }

  private parseDate(value: string): Date {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)
    ) {
      this.fail(400, 'La fecha y hora deben ser ISO 8601 con zona horaria');
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime()) ||
      date.getUTCFullYear() < 2000 ||
      date.getUTCFullYear() > 2100
    ) {
      this.fail(400, 'Fecha de turno inválida');
    }

    return date;
  }

  private clean(data: UpdateAppointmentData) {
    const source = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const field of ['title', 'doctor_name', 'location']) {
      if (!Object.prototype.hasOwnProperty.call(source, field)) {
        continue;
      }

      const value = source[field];

      if (value !== null && typeof value !== 'string') {
        this.fail(400, `El campo ${field} no es válido`);
      }

      const text = value === null ? '' : value.trim();

      if (text.length > 100) {
        this.fail(400, `El campo ${field} supera 100 caracteres`);
      }

      if (field === 'title' && !text) {
        this.fail(400, 'El motivo del turno es obligatorio');
      }

      result[field] = field === 'title' ? text : text || null;
    }

    if (source.scheduled_at !== undefined) {
      if (typeof source.scheduled_at !== 'string') {
        this.fail(400, 'Fecha y hora obligatorias');
      }

      result.scheduled_at = this.parseDate(source.scheduled_at);
    }

    if (source.modality !== undefined) {
      if (
        source.modality !== 'Presencial' &&
        source.modality !== 'Virtual'
      ) {
        this.fail(400, 'La modalidad debe ser Presencial o Virtual');
      }

      result.modality = source.modality;
    }

    return result;
  }

  private format(
    item: HydratedDocument<Appointment>,
  ): AppointmentResult {
    return {
      id_appointment: item._id.toString(),
      title: item.title,
      scheduled_at: item.scheduled_at.toISOString(),
      doctor_name: item.doctor_name ?? null,
      location: item.location ?? null,
      modality: item.modality,
      file_count: 0,
      note_count: 0,
    };
  }

  async list(patientId: string): Promise<AppointmentResult[]> {
    this.validateId(patientId);

    const items = await this.appointments
      .find({ id_patient: patientId })
      .sort({ scheduled_at: 1 })
      .exec();

    return items.map(item => this.format(item));
  }

  async get(patientId: string, id: string): Promise<AppointmentResult> {
    this.validateId(id);

    const item = await this.appointments.findOne({
      _id: id,
      id_patient: patientId,
    }).exec();

    if (!item) this.fail(404, 'Turno no encontrado');

    return this.format(item);
  }

  async create(patientId: string, data: AppointmentData) {
    this.validateId(patientId);

    const cleaned = this.clean(data);

    if (!cleaned.title || !cleaned.scheduled_at) {
      this.fail(400, 'El motivo y la fecha del turno son obligatorios');
    }

    const item = await this.appointments.create({
      id_patient: patientId,
      modality: 'Presencial',
      ...cleaned,
    });

    return this.format(item);
  }

  async update(
    patientId: string,
    id: string,
    data: UpdateAppointmentData,
  ) {
    this.validateId(id);

    const cleaned = this.clean(data);

    const item = await this.appointments.findOneAndUpdate(
      { _id: id, id_patient: patientId },
      { $set: cleaned },
      { new: true, runValidators: true },
    ).exec();

    if (!item) this.fail(404, 'Turno no encontrado');

    return this.format(item);
  }

  async remove(patientId: string, id: string): Promise<boolean> {
    this.validateId(id);

    const result = await this.appointments.findOneAndDelete({
      _id: id,
      id_patient: patientId,
    }).exec();

    if (!result) this.fail(404, 'Turno no encontrado');

    return true;
  }
}