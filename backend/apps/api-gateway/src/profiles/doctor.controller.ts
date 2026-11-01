import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@app/contracts';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

import { ProfilesService } from './profiles.service';
import { DoctorProfileDto } from './dto/doctor-profile.dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('profile')
  saveProfile(
    @Req() request: AuthenticatedRequest,
    @Body() data: DoctorProfileDto,
  ) {
    return this.profilesService.saveDoctor(
      request.user!.sub,
      data,
    );
  }

  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.profilesService.getDoctor(
      request.user!.sub,
    );
  }
}