import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import { DrcDateService } from './drc-date.service';
import { CreateDrcDateDto } from './dto/create-drc-date.dto';
import { SearchDto } from 'src/global/dto/search.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { FileExcelPipe } from 'src/file/validation/file-excel.pipe';
import { File as MulterFile } from 'multer';
import {
  KeycloakAccountRole,
  PartOfDay,
  Priority,
  TruckStatus,
} from '@prisma/client';
import { CreateTruckByDateDto } from './dto/create-truck-by-date.dto';
import { UnassignDto } from './dto/unassign-drc.dto';
import { DeleteLocationDrcDto } from './dto/delete-location-drc.dto';
import { UpdatePartOfDayDto } from './dto/update-part-of-day.dto';
import { Response } from 'express';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/drc-date')
export class DrcDateController {
  constructor(private readonly drcDateService: DrcDateService) {}

  @Post()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(@Body() createDrcDateDto: CreateDrcDateDto) {
    return await this.drcDateService.create(createDrcDateDto);
  }

  @Post('create-drc/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createDrc(
    @UploadedFile(FileExcelPipe) file: MulterFile,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.drcDateService.createDrc(file, id);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() searchDto: SearchDto) {
    const { query, page, limit } = searchDto;
    return this.drcDateService.findAll(query, page, limit);
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.drcDateService.findOne(id);
  }

  @Get('get-all-zones/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getAllZones(@Param('id', ParseIntPipe) id: number) {
    return this.drcDateService.getAllZones(id);
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async remove(@Param('id') id: string) {
    return this.drcDateService.remove(+id);
  }

  @Get('get-all-trucks/route')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getFilteredTrucks(
    @Query('deliveryRouteCalculationDateId')
    deliveryRouteCalculationDateId?: number,
    @Query('truckSizeId') truckSizeId?: number,
    @Query('zoneId') zoneId?: number,
    @Query('fuelId') fuelId?: number,
    @Query('warehouseId') warehouseId?: number,
    @Query('truckOwnershipTypeId') truckOwnershipTypeId?: number,
    @Query('licensePlate') licensePlate?: string,
    @Query('status') status?: TruckStatus,
  ) {
    return this.drcDateService.getFilteredTrucks({
      deliveryRouteCalculationDateId,
      truckSizeId,
      zoneId,
      fuelId,
      warehouseId,
      truckOwnershipTypeId,
      licensePlate,
      status,
    });
  }

  @Get('get-all-locations/route')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAllLocations(
    @Query('deliveryRouteCalculationDateId')
    deliveryRouteCalculationDateId?: number,
    @Query('zoneId') zoneId?: number,
    @Query('truckSizeId') truckSizeId?: number,
    @Query('partOfDay') partOfDay?: PartOfDay,
    @Query('priority') priority?: Priority,
    @Query('capacity') capacity?: number,
    @Query('query') query?: string,
    @Query('isAssign') isAssign?: string,
    @Query('truckByDateId') truckByDateId?: string,
  ) {
    return this.drcDateService.findAllLocations({
      deliveryRouteCalculationDateId,
      zoneId,
      truckSizeId,
      partOfDay,
      priority,
      capacity,
      query,
      isAssign,
      truckByDateId,
    });
  }

  @Post('assign-locations-truck/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async assignLocationToTruck(
    @Body() createTruckByDateDto: CreateTruckByDateDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.drcDateService.assignLocationToTruck(
      +id,
      createTruckByDateDto,
    );
  }

  @Post('auto-assign-locations-truck/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async autoAssign(@Param('id', ParseIntPipe) id: number) {
    return await this.drcDateService.autoAssign(+id);
  }

  @Delete('unassign-locations-truck/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async unassignLocationToTruck(
    @Body() unassignDto: UnassignDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.drcDateService.unassignLocationToTruck(+id, unassignDto);
  }

  @Delete('delete-locations-drc/route')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async deleteLocationDrc(@Body() deleteLocationDrcDto: DeleteLocationDrcDto) {
    return await this.drcDateService.deleteLocationDrc(deleteLocationDrcDto);
  }

  @Patch('update-location-part-of-day/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async updateLocationPartOfDay(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartOfDayDto: UpdatePartOfDayDto,
  ) {
    return this.drcDateService.updateLocationPartOfDay(+id, updatePartOfDayDto);
  }

  @Get('get-all-warehouses/route')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getAllWarehouse() {
    return this.drcDateService.getAllWarehouse();
  }

  @Get('get-all-case-name/route')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async getAllCaseNames() {
    return this.drcDateService.getAllCaseNames();
  }

  @Get('download-excel-file/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async exportExcelFile(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const jsonData = await this.drcDateService.exportExcelFile(+id);

      // Convert JSON to Excel buffer
      const buffer = this.drcDateService.convertJsonToExcel(jsonData);

      // Set response headers to prompt file download
      res.setHeader('Content-Disposition', 'attachment; filename=data.xlsx');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      // Send the Excel file
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting Excel file:', error);
      res.status(500).send('Failed to generate Excel file');
    }
  }
  @Post('create-single-location/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async createNewLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return await this.drcDateService.createNewLocation(+id, data);
  }
  @Patch('update-single-location/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async updateSingleLocationInf(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return await this.drcDateService.updateSingleLocationInf(+id, data);
  }
  @Patch('update-cap-single-location/route/:id')
  async updateCapNewLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return await this.drcDateService.updateCapNewLocation(+id, data);
  }
  @Patch('update-single-location-split/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async updateSingleLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return await this.drcDateService.updateSingleLocation(+id, data);
  }
  @Delete('delete-single-location/route/:id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async deleteSingleLocation(@Param('id', ParseIntPipe) id: number) {
    return await this.drcDateService.deleteSingleLocation(+id);
  }
}
