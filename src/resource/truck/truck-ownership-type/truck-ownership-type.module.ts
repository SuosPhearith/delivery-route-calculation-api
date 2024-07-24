import { Module } from '@nestjs/common';
import { TruckOwnershipTypeService } from './truck-ownership-type.service';
import { TruckOwnershipTypeController } from './truck-ownership-type.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [TruckOwnershipTypeController],
  providers: [TruckOwnershipTypeService],
  imports: [KeycloakModule],
})
export class TruckOwnershipTypeModule {}
