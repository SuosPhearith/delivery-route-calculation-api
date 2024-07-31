import { TruckStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { SearchDto } from 'src/global/dto/search.dto';

export class FilterDto extends SearchDto {
  @IsOptional()
  @IsEnum(TruckStatus)
  status: TruckStatus;

  @IsOptional()
  @Type(() => Number) // This will convert the string to a number
  @IsInt()
  truckSizeId?: number;

  @IsOptional()
  @Type(() => Number) // This will convert the string to a number
  @IsInt()
  zoneId?: number;

  @IsOptional()
  @Type(() => Number) // This will convert the string to a number
  @IsInt()
  fuelId?: number;

  @IsOptional()
  @Type(() => Number) // This will convert the string to a number
  @IsInt()
  warehouseId?: number;

  @IsOptional()
  @Type(() => Number) // This will convert the string to a number
  @IsInt()
  truckOwnershipTypeId?: number;
}
