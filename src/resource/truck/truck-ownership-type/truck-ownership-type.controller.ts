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
import { TruckOwnershipTypeService } from './truck-ownership-type.service';
import { CreateTruckOwnershipTypeDto } from './dto/create-truck-ownership-type.dto';
import { UpdateTruckOwnershipTypeDto } from './dto/update-truck-ownership-type.dto';
import { PaginationDto } from 'src/global/dto/pagination.dto';

@Controller('api/v1/truck-ownership-type')
export class TruckOwnershipTypeController {
  constructor(
    private readonly truckOwnershipTypeService: TruckOwnershipTypeService,
  ) {}

  @Post()
  async create(
    @Body() createTruckOwnershipTypeDto: CreateTruckOwnershipTypeDto,
  ) {
    return this.truckOwnershipTypeService.create(createTruckOwnershipTypeDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    return this.truckOwnershipTypeService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.truckOwnershipTypeService.findOne(+id);
  }

  @Patch(':id')
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
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.truckOwnershipTypeService.remove(+id);
  }
}
