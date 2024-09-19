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
  UseGuards,
} from '@nestjs/common';
import { CaseService } from './case.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { PaginationDto } from 'src/global/dto/pagination.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/case')
export class CaseController {
  constructor(private readonly caseService: CaseService) {}

  @Post()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(@Body() createCaseDto: CreateCaseDto) {
    return this.caseService.create(createCaseDto);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    return this.caseService.findAll(page, limit);
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.caseService.findOne(+id);
  }

  @Patch(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCaseDto: UpdateCaseDto,
  ) {
    return this.caseService.update(+id, updateCaseDto);
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.caseService.remove(+id);
  }
}
