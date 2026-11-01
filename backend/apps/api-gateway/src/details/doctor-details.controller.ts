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
import { DoctorDetailsDto } from './dto/doctor-details.dto';

@Controller('doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DOCTOR)
export class DoctorDetailsController {
  constructor(private readonly detailsService: DetailsService) {}

  @Get('details')
  getDetails(@Req() request: AuthenticatedRequest) {
    return this.detailsService.getDoctor(request.user!.sub);
  }

  @Put('details')
  saveDetails(
    @Req() request: AuthenticatedRequest,
    @Body() data: DoctorDetailsDto,
  ) {
    return this.detailsService.saveDoctor(
      request.user!.sub,
      data,
    );
  }
}