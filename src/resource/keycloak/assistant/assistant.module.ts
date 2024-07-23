import { Module } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantController } from './assistant.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService],
  imports: [KeycloakModule],
})
export class AssistantModule {}
