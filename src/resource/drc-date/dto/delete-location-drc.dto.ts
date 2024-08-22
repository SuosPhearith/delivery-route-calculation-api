import { PartOfDay, Priority } from '@prisma/client';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteLocationDrcDto {
  @IsNotEmpty()
  @IsNumber()
  deliveryRouteCalculationDateId: number;

  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude: number;

  @IsNotEmpty()
  partOfDay: PartOfDay;

  @IsNotEmpty()
  priority: Priority;
}
