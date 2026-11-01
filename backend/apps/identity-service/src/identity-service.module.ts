import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { HealthController } from './health.controller';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { DetailsModule } from './details/details.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>(
          'MONGO_IDENTITY_URI',
        ),
        serverSelectionTimeoutMS: 5000,
      }),
    }),

    UsersModule,
    ProfilesModule,
    DetailsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class IdentityServiceModule {}