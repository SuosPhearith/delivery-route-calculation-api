import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [DriverController],
  providers: [DriverService],
  imports: [KeycloakModule],
})
export class DriverModule {}
