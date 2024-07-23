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
import { OfficerControllService } from './officer-controll.service';
import { CreateOfficerControllDto } from './dto/create-officer-controll.dto';
import { UpdateOfficerControllDto } from './dto/update-officer-controll.dto';
import { SearchDto } from 'src/global/dto/search.dto';

@Controller('api/v1/officer-controll')
export class OfficerControllController {
  constructor(
    private readonly officerControllService: OfficerControllService,
  ) {}

  @Post()
  async create(@Body() createOfficerControllDto: CreateOfficerControllDto) {
    return this.officerControllService.create(createOfficerControllDto);
  }

  @Get()
  async findAll(@Query() searchDto: SearchDto) {
    const { query, page, limit } = searchDto;
    return this.officerControllService.findAll(query, page, limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.officerControllService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOfficerControllDto: UpdateOfficerControllDto,
  ) {
    return this.officerControllService.update(+id, updateOfficerControllDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.officerControllService.remove(+id);
  }
}
