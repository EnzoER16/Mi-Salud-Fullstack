import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RpcException } from '@nestjs/microservices';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import {
  RegisterUserPayload,
  LoginUserPayload,
  PublicUser,
} from '@app/contracts';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  private toPublic(user: UserDocument): PublicUser {
    return {
      id_user: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async register(data: RegisterUserPayload): Promise<PublicUser> {
    const username = data.username.trim();
    const email = data.email.trim().toLowerCase();

    const existing = await this.userModel.exists({
      $or: [{ email }, { username }],
    });

    if (existing) {
      throw new RpcException({
        statusCode: 409,
        message: 'El correo o nombre de usuario ya existe',
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    try {
      const user = await this.userModel.create({
        username,
        email,
        passwordHash,
        role: data.role,
      });

      return this.toPublic(user);
    } catch (error: unknown) {
      const dbError = error as { code?: number };

      if (dbError.code === 11000) {
        throw new RpcException({
          statusCode: 409,
          message: 'El correo o nombre de usuario ya existe',
        });
      }

      throw error;
    }
  }

  async validateCredentials(
    data: LoginUserPayload,
  ): Promise<PublicUser> {
    const email = data.email.trim().toLowerCase();

    const user = await this.userModel
      .findOne({ email })
      .select('+passwordHash')
      .exec();

    const validPassword =
      user && (await bcrypt.compare(data.password, user.passwordHash));

    if (!user || !validPassword) {
      throw new RpcException({
        statusCode: 401,
        message: 'Email o contraseña incorrectos',
      });
    }

    return this.toPublic(user);
  }

  async findById(id: string): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw new RpcException({
        statusCode: 404,
        message: 'Usuario no encontrado',
      });
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Usuario no encontrado',
      });
    }

    return this.toPublic(user);
  }
}