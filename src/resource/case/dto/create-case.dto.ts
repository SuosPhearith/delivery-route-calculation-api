import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, MaxLength } from 'class-validator';

export class CreateCaseDto {
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  caseLenght: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  caseWeight: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  caseHeight: number;
}
