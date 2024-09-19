import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DirectionService } from './direction.service';
import { CreateDirectionDto } from './dto/create-direction.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { FileExcelPipe } from 'src/file/validation/file-excel.pipe';
import { File as MulterFile } from 'multer';
import { SearchDto } from 'src/global/dto/search.dto';
import { KeycloakRoles } from 'src/keycloak/decorators/keycloak-roles/keycloak-roles.decorator';
import { KeycloakAccountRole } from '@prisma/client';
import { KeycloakAuthenticationGuard } from 'src/keycloak/guards/keycloak-authentication/keycloak-authentication.guard';
import { KeycloakAuthorizationGuard } from 'src/keycloak/guards/keycloak-authorization/keycloak-authorization.guard';

@Controller('api/v1/direction')
export class DirectionController {
  constructor(private readonly directionService: DirectionService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async create(
    @Body() createDirectionDto: CreateDirectionDto,
    @UploadedFile(FileExcelPipe) file: MulterFile,
  ) {
    return this.directionService.create(createDirectionDto, file);
  }

  @Get()
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findAll(@Query() searchDto: SearchDto) {
    const { query, page, limit } = searchDto;
    return this.directionService.findAll(query, page, limit);
  }

  @Get(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('order') order: string,
  ) {
    return this.directionService.findOne(+id, order);
  }

  @Delete(':id')
  @KeycloakRoles(KeycloakAccountRole.MANAGER, KeycloakAccountRole.ADMIN)
  @UseGuards(KeycloakAuthenticationGuard, KeycloakAuthorizationGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.directionService.remove(+id);
  }
}
