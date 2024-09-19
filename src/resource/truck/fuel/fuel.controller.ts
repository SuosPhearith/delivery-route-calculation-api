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
import { FuelService } from './fuel.service';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { PaginationDto } from 'src/global/dto/pagination.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(@Body() createFuelDto: CreateFuelDto) {
    return this.fuelService.create(createFuelDto);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    return this.fuelService.findAll(page, limit);
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fuelService.findOne(+id);
  }

  @Patch(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFuelDto: UpdateFuelDto,
  ) {
    return this.fuelService.update(+id, updateFuelDto);
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fuelService.remove(+id);
  }
}
