import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SortType } from './enum/chart';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
  @Get()
  async findAll(@Query('start') start: string, @Query('end') end: string) {
    return this.dashboardService.findAll(start, end);
  }
  @Get('get-chart-one')
  async getChartOne(@Query('sort') sort: SortType) {
    return this.dashboardService.getChartOne(sort);
  }
  @Get('get-chart-three')
  async getChartThree(@Query('sort') sort: SortType) {
    return this.dashboardService.getChartThree(sort);
  }
  @Get('get-chart-two')
  async getChartTwo() {
    return this.dashboardService.getChartTwo();
  }
  @Get('get-chart-six')
  async getChartSix(@Query('sort') sort: SortType) {
    return this.dashboardService.getChartSix(sort);
  }
}
