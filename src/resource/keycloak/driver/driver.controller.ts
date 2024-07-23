import { Controller, Get, Query } from '@nestjs/common';
import { DriverService } from './driver.service';
import { FilterDto } from 'src/global/dto/filter.dto';

@Controller('api/v1/driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}
  @Get()
  async findAll(@Query() filterDto: FilterDto) {
    const { query, page, limit, status } = filterDto;
    return this.driverService.findAll(query, page, limit, status);
  }
}
