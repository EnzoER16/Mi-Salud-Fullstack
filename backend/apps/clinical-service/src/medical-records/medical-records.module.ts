import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';

import {
  MedicalRecord,
  MedicalRecordSchema,
} from './schemas/medical-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: MedicalRecord.name,
        schema: MedicalRecordSchema,
      },
    ]),
  ],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
})
export class MedicalRecordsModule {}