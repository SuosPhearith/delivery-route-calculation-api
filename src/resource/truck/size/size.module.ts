import { Module } from '@nestjs/common';
import { SizeService } from './size.service';
import { SizeController } from './size.controller';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [SizeController],
  providers: [SizeService],
  imports: [KeycloakModule],
})
export class SizeModule {}
