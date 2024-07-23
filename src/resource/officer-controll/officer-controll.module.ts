import { Module } from '@nestjs/common';
import { OfficerControllService } from './officer-controll.service';
import { OfficerControllController } from './officer-controll.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [OfficerControllController],
  providers: [OfficerControllService],
  imports: [KeycloakModule],
})
export class OfficerControllModule {}
