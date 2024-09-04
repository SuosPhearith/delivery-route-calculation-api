import { IsEnum } from 'class-validator'; // Adjust the import path accordingly
import { SortType } from '../enum/chart';

export class ChartOneDto {
  @IsEnum(SortType)
  sort: SortType;
}
