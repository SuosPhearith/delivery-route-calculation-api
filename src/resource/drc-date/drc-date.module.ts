import { Module } from '@nestjs/common';
import { DrcDateService } from './drc-date.service';
import { DrcDateController } from './drc-date.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';
import { FileUploadModule } from 'src/file/file-upload.module';

@Module({
  controllers: [DrcDateController],
  providers: [DrcDateService],
  imports: [KeycloakModule, FileUploadModule],
})
export class DrcDateModule {}
