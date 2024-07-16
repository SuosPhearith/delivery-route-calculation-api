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
import { AssistantService } from './assistant.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';
import { FilterDto } from './dto/filter-dto';

@Controller('api/v1/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post()
  async create(@Body() createAssistantDto: CreateAssistantDto) {
    return this.assistantService.create(createAssistantDto);
  }

  @Get()
  async findAll(@Query() filterDto: FilterDto) {
    const { query, page, limit, status } = filterDto;
    return this.assistantService.findAll(query, page, limit, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.assistantService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssistantDto: UpdateAssistantDto,
  ) {
    return this.assistantService.update(+id, updateAssistantDto);
  }

  @Patch(':id/toggle-active')
  async toggle(@Param('id') id: string) {
    return this.assistantService.toggle(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.assistantService.remove(+id);
  }
}
