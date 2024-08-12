import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateTruckByDateDto {
  @IsInt()
  truckByDateId: number;

  @IsArray()
  @ArrayNotEmpty()
  deliveryRouteCalculationDateIds: number[];
}
