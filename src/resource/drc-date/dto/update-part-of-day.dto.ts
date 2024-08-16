import { PartOfDay } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdatePartOfDayDto {
  @IsNotEmpty()
  @IsEnum(PartOfDay)
  partOfDay: PartOfDay;
}
