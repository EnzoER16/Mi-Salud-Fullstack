import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@app/contracts';

import {JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { DetailsService } from './details.service';
import { PatientDetailsDto } from './dto/patient-details.dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class PatientDetailsController {
  constructor(private readonly detailsService: DetailsService) {}

  @Get('details')
  getDetails(@Req() request: AuthenticatedRequest) {
    return this.detailsService.getPatient(request.user!.sub);
  }

  @Put('details')
  saveDetails(
    @Req() request: AuthenticatedRequest,
    @Body() data: PatientDetailsDto,
  ) {
    return this.detailsService.savePatient(
      request.user!.sub,
      data,
    );
  }
}