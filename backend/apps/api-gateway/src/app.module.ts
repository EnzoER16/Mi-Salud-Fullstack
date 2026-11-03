import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Request } from 'express';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

import { InternalClientsModule } from './clients/clients.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { DetailsModule } from './details/details.module';
import { EmergencyContactsModule } from './emergency-contacts/emergency-contacts.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { GraphqlClinicalModule } from './graphql-clinical/graphql-clinical.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    InternalClientsModule,
    AuthModule,
    ProfilesModule,
    DetailsModule,
    EmergencyContactsModule,
    MedicalRecordsModule,

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      path: '/graphql',
      autoSchemaFile: true,
      sortSchema: true,
      graphiql: process.env.NODE_ENV !== 'production',
      context: ({ req }: { req: Request }) => ({ req }),
    }),

    GraphqlClinicalModule,
  ],
  controllers: [
    AppController,
    HealthController,
  ],
  providers: [AppService],
})
export class AppModule {}