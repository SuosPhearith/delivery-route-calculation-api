import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  imports: [KeycloakModule],
})
export class DashboardModule {}
