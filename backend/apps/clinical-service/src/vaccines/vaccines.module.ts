import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { VaccinesController } from './vaccines.controller';
import { VaccinesService } from './vaccines.service';
import { Vaccine, VaccineSchema } from './schemas/vaccine.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vaccine.name, schema: VaccineSchema },
    ]),
  ],
  controllers: [VaccinesController],
  providers: [VaccinesService],
})
export class VaccinesModule {}