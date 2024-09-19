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
import { TruckService } from './truck.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { FilterDto } from 'src/global/dto/filter-truck.dto';
import { ReassignAssistantDto } from './dto/reassign-assistant.dto';
import { ReassignDriverDto } from './dto/reassign-driver.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/truck')
export class TruckController {
  constructor(private readonly truckService: TruckService) {}

  @Get('find-all-truck-ownership-types/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllTruckOwnershipTypes() {
    return this.truckService.findAllTruckOwnershipTypes();
  }

  @Get('find-all-warehouses/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllWarehouses() {
    return this.truckService.findAllWarehouses();
  }

  @Get('find-all-zones/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllZones() {
    return this.truckService.findAllZones();
  }

  @Get('find-all-truck-sizes/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllTruckSizes() {
    return this.truckService.findAllTruckSizes();
  }

  @Get('find-all-truck-fuels/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllTruckFuels() {
    return this.truckService.findAllTruckFuels();
  }

  @Get('find-all-drivers/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllDrivers() {
    return this.truckService.findAllDrivers();
  }

  @Get('find-all-assistants/select')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllAssistants() {
    return this.truckService.findAllAssistants();
  }

  @Post()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(@Body() createTruckDto: CreateTruckDto) {
    return this.truckService.create(createTruckDto);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() filterDto: FilterDto) {
    const {
      query,
      page,
      limit,
      status,
      truckSizeId,
      zoneId,
      fuelId,
      warehouseId,
      truckOwnershipTypeId,
    } = filterDto;
    return this.truckService.findAll(
      query,
      page,
      limit,
      status,
      truckSizeId,
      zoneId,
      fuelId,
      warehouseId,
      truckOwnershipTypeId,
    );
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.truckService.findOne(+id);
  }

  @Patch(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTruckDto: UpdateTruckDto,
  ) {
    return this.truckService.update(+id, updateTruckDto);
  }

  @Patch(':id/update-status')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async updateStatus(@Param('id', ParseIntPipe) id: number) {
    return this.truckService.updateStatus(+id);
  }

  @Patch(':id/reassign-assistant')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async reassignAssistant(
    @Param('id', ParseIntPipe) id: number,
    @Body() reassignAssistantDto: ReassignAssistantDto,
  ) {
    return this.truckService.reassignAssistant(+id, reassignAssistantDto);
  }

  @Patch(':id/reassign-driver')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async reassignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() reassignDriverDto: ReassignDriverDto,
  ) {
    return this.truckService.reassignDriver(+id, reassignDriverDto);
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.truckService.remove(+id);
  }
}
