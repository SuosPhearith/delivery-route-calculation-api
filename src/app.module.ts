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

@Module({
  imports: [ConfigModule.forRoot(), AuthModule, FileUploadModule, LicenseModule, AssistantModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, JwtService],
})
export class AppModule {}
