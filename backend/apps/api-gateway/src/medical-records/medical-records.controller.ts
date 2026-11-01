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
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { MedicalRecordsService } from './medical-records.service';
import { SaveMedicalRecordDto } from './dto/save-medical-record.dto';

@Controller('medical-record')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class MedicalRecordsController {
  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  @Get()
  getRecord(@Req() request: AuthenticatedRequest) {
    return this.medicalRecordsService.get(
      request.user!.sub,
    );
  }

  @Post()
  saveRecord(
    @Req() request: AuthenticatedRequest,
    @Body() data: SaveMedicalRecordDto,
  ) {
    return this.medicalRecordsService.save(
      request.user!.sub,
      data,
    );
  }
}