import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/driver-resource')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}
  @Get()
  @KeycloakRoles(KeycloakAccountRole.ASSISTANT, KeycloakAccountRole.DRIVER)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getData(@Req() { user }) {
    return this.driverService.getData(user);
  }
}
