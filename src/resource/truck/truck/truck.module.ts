import { Module } from '@nestjs/common';
import { TruckService } from './truck.service';
import { TruckController } from './truck.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [TruckController],
  providers: [TruckService],
  imports: [KeycloakModule],
})
export class TruckModule {}
