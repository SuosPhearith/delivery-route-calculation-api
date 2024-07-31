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
} from '@nestjs/common';
import { TruckService } from './truck.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { FilterDto } from 'src/global/dto/filter-truck.dto';
import { ReassignAssistantDto } from './dto/reassign-assistant.dto';
import { ReassignDriverDto } from './dto/reassign-driver.dto';

@Controller('api/v1/truck')
export class TruckController {
  constructor(private readonly truckService: TruckService) {}

  @Get('find-all-truck-ownership-types/select')
  async findAllTruckOwnershipTypes() {
    return this.truckService.findAllTruckOwnershipTypes();
  }

  @Get('find-all-warehouses/select')
  async findAllWarehouses() {
    return this.truckService.findAllWarehouses();
  }

  @Get('find-all-zones/select')
  async findAllZones() {
    return this.truckService.findAllZones();
  }

  @Get('find-all-truck-sizes/select')
  async findAllTruckSizes() {
    return this.truckService.findAllTruckSizes();
  }

  @Get('find-all-truck-fuels/select')
  async findAllTruckFuels() {
    return this.truckService.findAllTruckFuels();
  }

  @Get('find-all-drivers/select')
  async findAllDrivers() {
    return this.truckService.findAllDrivers();
  }

  @Get('find-all-assistants/select')
  async findAllAssistants() {
    return this.truckService.findAllAssistants();
  }

  @Post()
  async create(@Body() createTruckDto: CreateTruckDto) {
    return this.truckService.create(createTruckDto);
  }

  @Get()
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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.truckService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTruckDto: UpdateTruckDto,
  ) {
    return this.truckService.update(+id, updateTruckDto);
  }

  @Patch(':id/reassign-assistant')
  async reassignAssistant(
    @Param('id', ParseIntPipe) id: number,
    @Body() reassignAssistantDto: ReassignAssistantDto,
  ) {
    return this.truckService.reassignAssistant(+id, reassignAssistantDto);
  }

  @Patch(':id/reassign-driver')
  async reassignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() reassignDriverDto: ReassignDriverDto,
  ) {
    return this.truckService.reassignDriver(+id, reassignDriverDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.truckService.remove(+id);
  }
}
