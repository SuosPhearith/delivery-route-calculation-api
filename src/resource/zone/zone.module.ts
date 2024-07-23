import { Module } from '@nestjs/common';
import { ZoneService } from './zone.service';
import { ZoneController } from './zone.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [ZoneController],
  providers: [ZoneService],
  imports: [KeycloakModule],
})
export class ZoneModule {}
