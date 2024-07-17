import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, MaxLength } from 'class-validator';

export class CreateSizeDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  containerLenght: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  containerWeight: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  containerHeight: number;
}
