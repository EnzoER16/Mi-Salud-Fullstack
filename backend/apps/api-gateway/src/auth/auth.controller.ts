import { ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@app/contracts';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@ApiTags('Autenticacion')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiBody({ schema: { type: 'object', required: ['username','email','password','role'], properties: { username: { type: 'string', example: 'Paciente Demo' }, email: { type: 'string', format: 'email', example: 'paciente.demo@gmail.com' }, password: { type: 'string', format: 'password' }, role: { type: 'string', enum: ['Paciente','Doctor'] } } } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @ApiBody({ schema: { type: 'object', required: ['email','password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @ApiBearerAuth('JWT-auth')
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: AuthenticatedRequest) {
    return this.authService.profile(request.user!.sub);
  }

  // Ruta temporal para comprobar los permisos
  @ApiBearerAuth('JWT-auth')
  @Get('doctor-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  doctorOnly() {
    return {
      message: 'Acceso autorizado para médicos',
    };
  }
}