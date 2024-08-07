import { IsDate, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { IsNotPastDate } from 'src/global/custom-validation/IsNotPastDateConstraint';

export class CreateDrcDateDto {
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @IsNotPastDate({
    message: 'Date must be today or in the future',
  })
  date: Date;
}
