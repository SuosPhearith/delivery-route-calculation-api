import { Module } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { KeycloakController } from './keycloak.controller';
import { KeycloakAuthenticationGuard } from './guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from './guards/keycloak-authorization/keycloak-authorization.guard';
import { JwtService } from 'src/auth/jwt.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [KeycloakController],
  providers: [
    KeycloakService,
    KeycloakAuthenticationGuard,
    KeycloakAuthorizationGuard,
    JwtService,
    PrismaService,
  ],
  exports: [
    KeycloakService,
    KeycloakAuthenticationGuard,
    KeycloakAuthorizationGuard,
    JwtService,
    PrismaService,
  ],
})
export class KeycloakModule {}
