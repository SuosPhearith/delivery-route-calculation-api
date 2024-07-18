import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtService } from './auth/jwt.service';
import { FileUploadModule } from './file/file-upload.module';
import { LicenseModule } from './resource/driver/license/license.module';
import { AssistantModule } from './resource/driver/assistant/assistant.module';
import { DriverModule } from './resource/driver/driver/driver.module';
import { SizeModule } from './resource/truck/size/size.module';
import { FuelModule } from './resource/truck/fuel/fuel.module';
import { CaseModule } from './resource/case/case.module';
import { KeycloakModule } from './keycloak/keycloak.module';

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, FileUploadModule, LicenseModule, AssistantModule, DriverModule, SizeModule, FuelModule, CaseModule, KeycloakModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, JwtService],
})
export class AppModule {}
