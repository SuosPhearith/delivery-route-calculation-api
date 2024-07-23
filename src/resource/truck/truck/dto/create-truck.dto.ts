import { IsInt, IsString, IsOptional, IsNotEmpty } from 'class-validator';
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

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  driverId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  zoneId: number;

  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  warehouseId: number;
}
