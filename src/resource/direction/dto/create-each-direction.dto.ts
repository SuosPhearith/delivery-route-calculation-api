import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateEachDirectionDto {
  @IsString()
  @IsNotEmpty()
  route: string;

  @IsLatitude()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  lat: number;

  @IsLongitude()
  @IsNotEmpty()
  @Transform(({ value }) => parseFloat(value))
  long: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsString()
  @IsOptional()
  type: string;

  // Add any additional fields here
}
