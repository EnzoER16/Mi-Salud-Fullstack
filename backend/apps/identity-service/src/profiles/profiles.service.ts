import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';

import {
  UserRole,
  PatientProfileInput,
  DoctorProfileInput,
} from '@app/contracts';

import { User, UserDocument } from '../users/schemas/user.schema';
import { PatientProfile } from './schemas/patient-profile.schema';
import { DoctorProfile } from './schemas/doctor-profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

    @InjectModel(PatientProfile.name)
    private readonly patientModel: Model<PatientProfile>,

    @InjectModel(DoctorProfile.name)
    private readonly doctorModel: Model<DoctorProfile>,
  ) {}

  private async getUser(
    userId: string,
    role: UserRole,
  ): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new RpcException({
        statusCode: 404,
        message: 'Usuario no encontrado',
      });
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Usuario no encontrado',
      });
    }

    if (user.role !== role) {
      throw new RpcException({
        statusCode: 403,
        message: 'El rol del usuario no corresponde al perfil',
      });
    }

    return user;
  }

  private async updateUsername(
    user: UserDocument,
    username: string,
  ): Promise<void> {
    const cleaned = username.trim();

    if (user.username === cleaned) {
      return;
    }

    user.username = cleaned;

    try {
      await user.save();
    } catch (error: unknown) {
      const mongoError = error as { code?: number };

      if (mongoError.code === 11000) {
        throw new RpcException({
          statusCode: 409,
          message: 'El nombre de usuario ya está en uso',
        });
      }

      throw error;
    }
  }

  async savePatient(
    userId: string,
    data: PatientProfileInput,
  ) {
    const user = await this.getUser(userId, UserRole.PATIENT);

    const existed = await this.patientModel.exists({
      id_user: userId,
    });

    const profileData = {
      dni: data.dni.trim(),
      health_insurance: data.health_insurance?.trim() ?? '',
      plan: data.plan?.trim() ?? '',
      member_number: data.member_number?.trim() ?? '',
      address: data.address?.trim() ?? '',
    };

    let patient;

    try {
      patient = await this.patientModel.findOneAndUpdate(
        { id_user: userId },
        { $set: profileData },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      ).exec();
    } catch (error: unknown) {
      const mongoError = error as { code?: number };

      if (mongoError.code === 11000) {
        throw new RpcException({
          statusCode: 409,
          message: 'El DNI ya está registrado',
        });
      }

      throw error;
    }

    if (!patient) {
      throw new RpcException({
        statusCode: 500,
        message: 'No se pudo guardar el perfil',
      });
    }

    await this.updateUsername(user, data.username);

    return {
      message: existed
        ? 'Perfil de paciente actualizado exitosamente'
        : 'Perfil de paciente creado exitosamente',
      profile: {
        id_patient: patient._id.toString(),
        id_user: patient.id_user,
        username: user.username,
        ...profileData,
      },
    };
  }

  async getPatient(userId: string) {
    const user = await this.getUser(userId, UserRole.PATIENT);

    const patient = await this.patientModel
      .findOne({ id_user: userId })
      .exec();

    if (!patient) {
      throw new RpcException({
        statusCode: 404,
        message: 'Perfil de paciente no encontrado',
      });
    }

    return {
      id_patient: patient._id.toString(),
      id_user: patient.id_user,
      username: user.username,
      dni: patient.dni,
      health_insurance: patient.health_insurance,
      plan: patient.plan,
      member_number: patient.member_number,
      address: patient.address,
    };
  }

  async saveDoctor(
    userId: string,
    data: DoctorProfileInput,
  ) {
    const user = await this.getUser(userId, UserRole.DOCTOR);

    const existed = await this.doctorModel.exists({
      id_user: userId,
    });

    const profileData = {
      specialty: data.specialty.trim(),
      license_number: data.license_number.trim(),
    };

    const doctor = await this.doctorModel.findOneAndUpdate(
      { id_user: userId },
      { $set: profileData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).exec();

    if (!doctor) {
      throw new RpcException({
        statusCode: 500,
        message: 'No se pudo guardar el perfil',
      });
    }

    await this.updateUsername(user, data.username);

    return {
      message: existed
        ? 'Perfil de médico actualizado exitosamente'
        : 'Perfil de médico creado exitosamente',
      profile: {
        id_doctor: doctor._id.toString(),
        id_user: doctor.id_user,
        username: user.username,
        ...profileData,
      },
    };
  }

  async getDoctor(userId: string) {
    const user = await this.getUser(userId, UserRole.DOCTOR);

    const doctor = await this.doctorModel
      .findOne({ id_user: userId })
      .exec();

    if (!doctor) {
      throw new RpcException({
        statusCode: 404,
        message: 'Perfil de médico no encontrado',
      });
    }

    return {
      id_doctor: doctor._id.toString(),
      id_user: doctor.id_user,
      username: user.username,
      specialty: doctor.specialty,
      license_number: doctor.license_number,
    };
  }
}