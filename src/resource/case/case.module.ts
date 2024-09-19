import { Module } from '@nestjs/common';
import { CaseService } from './case.service';
import { CaseController } from './case.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [CaseController],
  providers: [CaseService],
  imports: [KeycloakModule],
})
export class CaseModule {}
