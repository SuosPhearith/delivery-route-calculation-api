import { IsArray, IsNotEmpty } from 'class-validator';

export class ReassignDriverDto {
  @IsNotEmpty()
  @IsArray()
  driver: number[];
}
