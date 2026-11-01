import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';

import { InternalClientsModule } from './clients/clients.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    InternalClientsModule,
    AuthModule,
    ProfilesModule,
  ],
  controllers: [
    AppController,
    HealthController,
  ],
  providers: [AppService],
})
export class AppModule {}