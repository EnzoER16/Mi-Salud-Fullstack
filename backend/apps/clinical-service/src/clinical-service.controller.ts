import { Controller, Get } from '@nestjs/common';
import { ClinicalServiceService } from './clinical-service.service';

@Controller()
export class ClinicalServiceController {
  constructor(private readonly clinicalServiceService: ClinicalServiceService) {}

  @Get()
  getHello(): string {
    return this.clinicalServiceService.getHello();
  }
}
