import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TruckOwnershipTypeService } from './truck-ownership-type.service';
import { CreateTruckOwnershipTypeDto } from './dto/create-truck-ownership-type.dto';
import { UpdateTruckOwnershipTypeDto } from './dto/update-truck-ownership-type.dto';
import { PaginationDto } from 'src/global/dto/pagination.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/truck-ownership-type')
export class TruckOwnershipTypeController {
  constructor(
    private readonly truckOwnershipTypeService: TruckOwnershipTypeService,
  ) {}

  @Post()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(
    @Body() createTruckOwnershipTypeDto: CreateTruckOwnershipTypeDto,
  ) {
    return this.truckOwnershipTypeService.create(createTruckOwnershipTypeDto);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    return this.truckOwnershipTypeService.findAll(page, limit);
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.truckOwnershipTypeService.findOne(+id);
  }

  @Patch(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTruckOwnershipTypeDto: UpdateTruckOwnershipTypeDto,
  ) {
    return this.truckOwnershipTypeService.update(
      +id,
      updateTruckOwnershipTypeDto,
    );
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.truckOwnershipTypeService.remove(+id);
  }
}
