import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '@app/contracts';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { EmergencyContactsService } from './emergency-contacts.service';

import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { UpdateEmergencyContactDto } from './dto/update-emergency-contact.dto';

@Controller('patient/emergency-contacts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
export class EmergencyContactsController {
  constructor(
    private readonly contactsService: EmergencyContactsService,
  ) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.contactsService.list(request.user!.sub);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateEmergencyContactDto,
  ) {
    return this.contactsService.create(
      request.user!.sub,
      data,
    );
  }

  @Patch(':contactId')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('contactId') contactId: string,
    @Body() data: UpdateEmergencyContactDto,
  ) {
    return this.contactsService.update(
      request.user!.sub,
      contactId,
      data,
    );
  }

  @Delete(':contactId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('contactId') contactId: string,
  ) {
    return this.contactsService.remove(
      request.user!.sub,
      contactId,
    );
  }
}