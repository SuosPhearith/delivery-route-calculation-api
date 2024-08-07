import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DrcDateService } from './drc-date.service';
import { CreateDrcDateDto } from './dto/create-drc-date.dto';
import { SearchDto } from 'src/global/dto/search.dto';

@Controller('api/v1/drc-date')
export class DrcDateController {
  constructor(private readonly drcDateService: DrcDateService) {}

  @Post()
  async create(@Body() createDrcDateDto: CreateDrcDateDto) {
    return await this.drcDateService.create(createDrcDateDto);
  }

  @Get()
  async findAll(@Query() searchDto: SearchDto) {
    const { query, page, limit } = searchDto;
    return this.drcDateService.findAll(query, page, limit);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.drcDateService.remove(+id);
  }
}
