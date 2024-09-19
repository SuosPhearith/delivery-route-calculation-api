import { Module } from '@nestjs/common';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [FuelController],
  providers: [FuelService],
  imports: [KeycloakModule],
})
export class FuelModule {}
