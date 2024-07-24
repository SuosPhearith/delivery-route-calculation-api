import {
  IsInt,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTruckDto {
  @IsInt()
  @Type(() => Number)
  truckSizeId: number;

  @IsInt()
  @Type(() => Number)
  fuelId: number;

  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  manufacturer?: string;

  @IsString()
  @IsOptional()
  functioning?: string;

  @IsNotEmpty()
  @IsArray()
  driver: number[];

  @IsNotEmpty()
  @IsArray()
  assistant: number[];

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  zoneId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  warehouseId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  truckOwnershipTypeId: number;
}
