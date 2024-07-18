import { Module } from '@nestjs/common';
import { SizeService } from './size.service';
import { SizeController } from './size.controller';
import { AuthModule } from 'src/auth/auth.module';
import { KeycloakModule } from 'src/keycloak/keycloak.module';

@Module({
  controllers: [SizeController],
  providers: [SizeService],
  imports: [AuthModule, KeycloakModule],
})
export class SizeModule {}
