import { Controller, Get, Query } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { FilterDto } from 'src/global/dto/filter.dto';

@Controller('api/v1/assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}
  @Get()
  async findAll(@Query() filterDto: FilterDto) {
    const { query, page, limit, status } = filterDto;
    return this.assistantService.findAll(query, page, limit, status);
  }
}
