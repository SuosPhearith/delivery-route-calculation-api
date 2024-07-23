import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [WarehouseController],
  providers: [WarehouseService],
  imports: [KeycloakModule],
})
export class WarehouseModule {}
