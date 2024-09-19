import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { FilterDto } from 'src/global/dto/filter.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}
  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() filterDto: FilterDto) {
    const { query, page, limit, status } = filterDto;
    return this.assistantService.findAll(query, page, limit, status);
  }
}
