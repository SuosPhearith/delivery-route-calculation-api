import { Module } from '@nestjs/common';
import { DirectionService } from './direction.service';
import { DirectionController } from './direction.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { FileUploadModule } from 'src/file/file-upload.module';

@Module({
  controllers: [DirectionController],
  providers: [DirectionService],
  imports: [KeycloakModule, FileUploadModule],
})
export class DirectionModule {}
