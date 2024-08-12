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
} from '@nestjs/common';
import { DrcDateService } from './drc-date.service';
import { CreateDrcDateDto } from './dto/create-drc-date.dto';
import { SearchDto } from 'src/global/dto/search.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { FileExcelPipe } from 'src/file/validation/file-excel.pipe';
import { File as MulterFile } from 'multer';
import { PartOfDay, Priority, TruckStatus } from '@prisma/client';
import { CreateTruckByDateDto } from './dto/create-truck-by-date.dto';
import { UnassignDto } from './dto/unassign-drc.dto';

@Controller('api/v1/drc-date')
export class DrcDateController {
  constructor(private readonly drcDateService: DrcDateService) {}

  @Post()
  async create(@Body() createDrcDateDto: CreateDrcDateDto) {
    return await this.drcDateService.create(createDrcDateDto);
  }

  @Post('create-drc/:id')
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createDrc(
    @UploadedFile(FileExcelPipe) file: MulterFile,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.drcDateService.createDrc(file, id);
  }

  @Get()
  async findAll(@Query() searchDto: SearchDto) {
    const { query, page, limit } = searchDto;
    return this.drcDateService.findAll(query, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.drcDateService.findOne(id);
  }

  @Get('get-all-zones/route/:id')
  async getAllZones(@Param('id', ParseIntPipe) id: number) {
    return this.drcDateService.getAllZones(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.drcDateService.remove(+id);
  }

  @Get('get-all-trucks/route')
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
  async assignLocationToTruck(
    @Body() createTruckByDateDto: CreateTruckByDateDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.drcDateService.assignLocationToTruck(
      +id,
      createTruckByDateDto,
    );
  }

  @Delete('unassign-locations-truck/route/:id')
  async unassignLocationToTruck(
    @Body() unassignDto: UnassignDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.drcDateService.unassignLocationToTruck(+id, unassignDto);
  }
}
