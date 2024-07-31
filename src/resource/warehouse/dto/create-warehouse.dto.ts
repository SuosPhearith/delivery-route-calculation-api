import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateWarehouseDto {
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @IsLatitude()
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  @IsLongitude()
  long: number;

  @IsOptional()
  information: string;
}
