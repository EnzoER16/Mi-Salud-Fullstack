import { Module } from '@nestjs/common';
import { ClinicalServiceController } from './clinical-service.controller';
import { ClinicalServiceService } from './clinical-service.service';

@Module({
  imports: [],
  controllers: [ClinicalServiceController],
  providers: [ClinicalServiceService],
})
export class ClinicalServiceModule {}
