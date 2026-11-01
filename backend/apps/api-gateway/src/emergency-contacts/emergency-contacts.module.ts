import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InternalClientsModule } from '../clients/clients.module';

import { EmergencyContactsController } from './emergency-contacts.controller';
import { EmergencyContactsService } from './emergency-contacts.service';

@Module({
  imports: [
    AuthModule,
    InternalClientsModule,
  ],
  controllers: [EmergencyContactsController],
  providers: [EmergencyContactsService],
})
export class EmergencyContactsModule {}