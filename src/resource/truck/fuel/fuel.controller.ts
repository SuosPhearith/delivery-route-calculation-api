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
} from '@nestjs/common';
import { FuelService } from './fuel.service';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { PaginationDto } from 'src/global/dto/pagination.dto';

@Controller('api/v1/fuel')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post()
  async create(@Body() createFuelDto: CreateFuelDto) {
    return this.fuelService.create(createFuelDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    return this.fuelService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fuelService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFuelDto: UpdateFuelDto,
  ) {
    return this.fuelService.update(+id, updateFuelDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fuelService.remove(+id);
  }
}
