import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { InternalClientsModule } from '../clients/clients.module';

import { GraphqlClinicalService } from './graphql-clinical.service';
import { GqlPatientGuard } from './gql-patient.guard';
import { VaccinesResolver } from './vaccines.resolver';
import { AppointmentsResolver } from './appointments.resolver';

@Module({
  imports: [
    AuthModule,
    InternalClientsModule,
  ],
  providers: [
    GraphqlClinicalService,
    GqlPatientGuard,
    VaccinesResolver,
    AppointmentsResolver,
  ],
})
export class GraphqlClinicalModule {}