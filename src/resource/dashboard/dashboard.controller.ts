import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SortType } from './enum/chart';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query('start') start: string, @Query('end') end: string) {
    return this.dashboardService.findAll(start, end);
  }
  @Get('get-chart-one')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getChartOne(@Query('sort') sort: SortType) {
    return this.dashboardService.getChartOne(sort);
  }
  @Get('get-chart-three')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getChartThree(@Query('sort') sort: SortType) {
    return this.dashboardService.getChartThree(sort);
  }
  @Get('get-chart-two')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getChartTwo() {
    return this.dashboardService.getChartTwo();
  }
  @Get('get-chart-six')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getChartSix(@Query('sort') sort: SortType) {
    return this.dashboardService.getChartSix(sort);
  }
}
