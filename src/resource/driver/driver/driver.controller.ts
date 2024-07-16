import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { FilterDto } from '../assistant/dto/filter-dto';
import { ResetPasswordDto } from '../assistant/dto/reset-password.dto';

@Controller('api/v1/driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  async create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  @Get()
  async findAll(@Query() filterDto: FilterDto) {
    const { query, page, limit, status } = filterDto;
    return this.driverService.findAll(query, page, limit, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.driverService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driverService.update(+id, updateDriverDto);
  }

  @Patch(':id/toggle-active')
  async toggle(@Param('id') id: string) {
    return this.driverService.toggle(+id);
  }

  @Patch(':id/reset-password')
  async reset(
    @Param('id') id: string,
    @Body() resetPassword: ResetPasswordDto,
  ) {
    return this.driverService.reset(+id, resetPassword);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.driverService.remove(+id);
  }
}
