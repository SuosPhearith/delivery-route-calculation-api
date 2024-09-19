import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { FilterDto } from 'src/global/dto/filter.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}
  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() filterDto: FilterDto) {
    const { query, page, limit } = filterDto;
    const status = filterDto.status ? filterDto.status : null;
    return this.driverService.findAll(query, page, limit, status);
  }
}
