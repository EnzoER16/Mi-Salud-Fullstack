import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { HydratedDocument, Model, Types } from 'mongoose';

import {
  UserRole,
  EmergencyContactInput,
  UpdateEmergencyContactInput,
  EmergencyContactResponse,
} from '@app/contracts';

import { User } from '../users/schemas/user.schema';
import { PatientProfile } from '../profiles/schemas/patient-profile.schema';
import { EmergencyContact } from './schemas/emergency-contact.schema';

const MAX_CONTACTS = 5;

@Injectable()
export class EmergencyContactsService {
  constructor(
    @InjectModel(User.name)
    private readonly users: Model<User>,

    @InjectModel(PatientProfile.name)
    private readonly patients: Model<PatientProfile>,

    @InjectModel(EmergencyContact.name)
    private readonly contacts: Model<EmergencyContact>,
  ) {}

  private error(statusCode: number, message: string): never {
    throw new RpcException({ statusCode, message });
  }

  private async getPatientId(userId: string): Promise<string> {
    if (!Types.ObjectId.isValid(userId)) {
      this.error(404, 'Usuario no encontrado.');
    }

    const user = await this.users.findById(userId).exec();

    if (!user) {
      this.error(404, 'Usuario no encontrado.');
    }

    if (user.role !== UserRole.PATIENT) {
      this.error(403, 'Acceso exclusivo para pacientes.');
    }

    const patient = await this.patients.findOne({
      id_user: userId,
    }).exec();

    if (!patient) {
      this.error(
        404,
        'Perfil de paciente no encontrado. Completá tus datos primero.',
      );
    }

    return patient._id.toString();
  }

  private toResponse(
    contact: HydratedDocument<EmergencyContact>,
  ): EmergencyContactResponse {
    return {
      id_contact: contact._id.toString(),
      name: contact.name,
      relationship: contact.relationship ?? null,
      phone: contact.phone,
    };
  }

  private clean(
    input: UpdateEmergencyContactInput,
    creating: boolean,
  ): UpdateEmergencyContactInput {
    const cleaned: UpdateEmergencyContactInput = {};

    if (creating || input.name !== undefined) {
      if (
        typeof input.name !== 'string' ||
        !input.name.trim() ||
        input.name.trim().length > 80
      ) {
        this.error(400, 'El nombre del contacto es obligatorio.');
      }

      cleaned.name = input.name.trim();
    }

    if (creating || input.phone !== undefined) {
      if (
        typeof input.phone !== 'string' ||
        input.phone.length > 25
      ) {
        this.error(400, 'El teléfono del contacto no es válido.');
      }

      const phone = input.phone.trim();
      const digits = phone.replace(/\D/g, '');

      if (
        !/^[0-9+()\s-]+$/.test(phone) ||
        digits.length < 6 ||
        digits.length > 15
      ) {
        this.error(400, 'El teléfono del contacto no es válido.');
      }

      cleaned.phone = phone;
    }

    if (creating || input.relationship !== undefined) {
      const relationship = input.relationship;

      if (
        relationship !== undefined &&
        relationship !== null &&
        typeof relationship !== 'string'
      ) {
        this.error(400, 'El parentesco no es válido.');
      }

      const value = relationship?.trim() || null;

      if (value !== null && value.length > 40) {
        this.error(400, 'El parentesco no puede superar 40 caracteres.');
      }

      cleaned.relationship = value;
    }

    return cleaned;
  }

  async list(userId: string): Promise<EmergencyContactResponse[]> {
    const patientId = await this.getPatientId(userId);

    const contacts = await this.contacts
      .find({ id_patient: patientId })
      .sort({ createdAt: 1, _id: 1 })
      .exec();

    return contacts.map(contact => this.toResponse(contact));
  }

  async create(
    userId: string,
    data: EmergencyContactInput,
  ): Promise<EmergencyContactResponse> {
    const patientId = await this.getPatientId(userId);

    const cleaned = this.clean(data, true);

    await this.contacts.init();

    for (let slot = 0; slot < MAX_CONTACTS; slot++) {
      try {
        const contact = await this.contacts.create({
          id_patient: patientId,
          slot,
          ...cleaned,
        });

        return this.toResponse(contact);
      } catch (error: unknown) {
        const mongoError = error as { code?: number };

        if (mongoError.code === 11000) {
          continue;
        }

        throw error;
      }
    }

    this.error(
      400,
      `Podés cargar hasta ${MAX_CONTACTS} contactos de emergencia.`,
    );
  }

  async update(
    userId: string,
    contactId: string,
    data: UpdateEmergencyContactInput,
  ): Promise<EmergencyContactResponse> {
    const patientId = await this.getPatientId(userId);

    if (!Types.ObjectId.isValid(contactId)) {
      this.error(404, 'Contacto no encontrado.');
    }

    const cleaned = this.clean(data, false);

    const contact = await this.contacts.findOneAndUpdate(
      {
        _id: contactId,
        id_patient: patientId,
      },
      { $set: cleaned },
      {
        new: true,
        runValidators: true,
      },
    ).exec();

    if (!contact) {
      this.error(404, 'Contacto no encontrado.');
    }

    return this.toResponse(contact);
  }

  async remove(userId: string, contactId: string) {
    const patientId = await this.getPatientId(userId);

    if (!Types.ObjectId.isValid(contactId)) {
      this.error(404, 'Contacto no encontrado.');
    }

    const result = await this.contacts.findOneAndDelete({
      _id: contactId,
      id_patient: patientId,
    }).exec();

    if (!result) {
      this.error(404, 'Contacto no encontrado.');
    }

    return {
      message: 'Contacto eliminado.',
    };
  }
}