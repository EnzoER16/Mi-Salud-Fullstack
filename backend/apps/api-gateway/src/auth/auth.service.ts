import {
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

import {
  MESSAGE_PATTERNS,
  JwtPayload,
  PublicUser,
} from '@app/contracts';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('IDENTITY_CLIENT')
    private readonly identityClient: ClientProxy,

    private readonly jwtService: JwtService,
  ) {}

  private async callIdentity<T>(
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
        'Servicio de usuarios no disponible',
      );
    }
  }

  async register(data: RegisterDto): Promise<PublicUser> {
    return this.callIdentity<PublicUser>(
      MESSAGE_PATTERNS.IDENTITY_REGISTER,
      data,
    );
  }

  async login(data: LoginDto) {
    const user = await this.callIdentity<PublicUser>(
      MESSAGE_PATTERNS.IDENTITY_LOGIN,
      data,
    );

    const payload: JwtPayload = {
      sub: user.id_user,
      username: user.username,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user,
    };
  }

  async profile(id: string): Promise<PublicUser> {
    return this.callIdentity<PublicUser>(
      MESSAGE_PATTERNS.IDENTITY_FIND_BY_ID,
      id,
    );
  }
}