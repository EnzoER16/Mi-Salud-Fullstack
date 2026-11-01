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
import { PatientProfileDto } from './dto/patient-profile.dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class PatientController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post('profile')
  saveProfile(
    @Req() request: AuthenticatedRequest,
    @Body() data: PatientProfileDto,
  ) {
    return this.profilesService.savePatient(
      request.user!.sub,
      data,
    );
  }

  @Get('profile')
  getProfile(@Req() request: AuthenticatedRequest) {
    return this.profilesService.getPatient(
      request.user!.sub,
    );
  }
}