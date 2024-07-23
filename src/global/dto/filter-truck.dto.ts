import { TruckStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { SearchDto } from 'src/global/dto/search.dto';

export class FilterDto extends SearchDto {
  @IsOptional()
  @IsEnum(TruckStatus)
  status: TruckStatus;
}
