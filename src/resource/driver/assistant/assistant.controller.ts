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
import { AssistantService } from './assistant.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';
import { FilterDto } from './dto/filter-dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

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
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assistantService.findOne(+id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssistantDto: UpdateAssistantDto,
  ) {
    return this.assistantService.update(+id, updateAssistantDto);
  }

  @Patch(':id/toggle-active')
  async toggle(@Param('id', ParseIntPipe) id: number) {
    return this.assistantService.toggle(+id);
  }

  @Patch(':id/reset-password')
  async reset(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPassword: ResetPasswordDto,
  ) {
    return this.assistantService.reset(+id, resetPassword);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.assistantService.remove(+id);
  }
}
