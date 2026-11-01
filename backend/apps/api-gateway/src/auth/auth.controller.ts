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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: AuthenticatedRequest) {
    return this.authService.profile(request.user!.sub);
  }

  // Ruta temporal para comprobar los permisos
  @Get('doctor-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  doctorOnly() {
    return {
      message: 'Acceso autorizado para médicos',
    };
  }
}