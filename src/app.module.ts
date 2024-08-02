import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtService } from './auth/jwt.service';
import { FileUploadModule } from './file/file-upload.module';
import { SizeModule } from './resource/truck/size/size.module';
import { FuelModule } from './resource/truck/fuel/fuel.module';
import { CaseModule } from './resource/case/case.module';
import { KeycloakModule } from './keycloak/keycloak.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { DriverModule } from './resource/keycloak/driver/driver.module';
import { TruckModule } from './resource/truck/truck/truck.module';
import { AssistantModule } from './resource/keycloak/assistant/assistant.module';
import { ZoneModule } from './resource/zone/zone.module';
import { OfficerControllModule } from './resource/officer-controll/officer-controll.module';
import { WarehouseModule } from './resource/warehouse/warehouse.module';
import { TruckOwnershipTypeModule } from './resource/truck/truck-ownership-type/truck-ownership-type.module';
import { DirectionModule } from './resource/direction/direction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => ({
    //     store: redisStore,
    //     host: configService.get('REDIS_HOST'),
    //     port: configService.get('REDIS_PORT'),
    //     ttl: configService.get('CACHE_TTL'), // seconds
    //   }),
    //   isGlobal: true,
    // }),
    AuthModule,
    FileUploadModule,
    DriverModule,
    SizeModule,
    FuelModule,
    CaseModule,
    KeycloakModule,
    TruckModule,
    AssistantModule,
    ZoneModule,
    OfficerControllModule,
    WarehouseModule,
    TruckOwnershipTypeModule,
    DirectionModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, JwtService],
})
export class AppModule {}
