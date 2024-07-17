import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class IdDto {
  @IsNotEmpty() // Ensures the value is not empty
  @Type(() => Number) // Transforms the value to a number
  @IsNumber() // Ensures the value is a number
  id: number;
}
