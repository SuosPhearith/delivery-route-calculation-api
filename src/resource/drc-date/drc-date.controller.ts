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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.drcDateService.remove(+id);
  }
}
