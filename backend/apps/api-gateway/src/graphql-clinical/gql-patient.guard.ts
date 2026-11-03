import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload, UserRole } from '@app/contracts';

export interface GraphQLAuthRequest {
  headers: {
    authorization?: string;
  };
  user?: JwtPayload;
}

@Injectable()
export class GqlPatientGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);

    const request =
      gqlContext.getContext<{ req: GraphQLAuthRequest }>().req;

    const authorization = request.headers.authorization || '';
    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token requerido');
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Token incompleto');
    }

    if (payload.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Acceso exclusivo para pacientes');
    }

    request.user = payload;

    return true;
  }
}