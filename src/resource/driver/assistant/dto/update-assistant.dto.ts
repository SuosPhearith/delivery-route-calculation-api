import { Gender } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DriverStatus } from 'src/resource/enums/driver-status.enum';

export class UpdateAssistantDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(15)
  phone: string;

  @IsNotEmpty()
  age: number;

  @IsNotEmpty()
  @IsEnum(DriverStatus)
  status: DriverStatus;
}
