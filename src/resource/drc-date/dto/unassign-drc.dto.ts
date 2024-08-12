import { IsArray, ArrayNotEmpty } from 'class-validator';

export class UnassignDto {
  @IsArray()
  @ArrayNotEmpty()
  locationIds: number[];
}
