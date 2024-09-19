import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ZoneService } from './zone.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { SearchDto } from 'src/global/dto/search.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/zone')
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  @Get('get-all-officer-controll/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllOfficerControll() {
    return this.zoneService.findAllOfficerControll();
  }

  @Post()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(@Body() createZoneDto: CreateZoneDto) {
    return this.zoneService.create(createZoneDto);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() searchDto: SearchDto) {
    const { query, page, limit } = searchDto;
    return this.zoneService.findAll(query, page, limit);
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.zoneService.findOne(+id);
  }

  @Patch(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateZoneDto: UpdateZoneDto,
  ) {
    return this.zoneService.update(+id, updateZoneDto);
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.zoneService.remove(+id);
  }
}
