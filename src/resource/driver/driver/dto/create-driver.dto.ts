import { Gender } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DriverStatus } from 'src/resource/enums/driver-status.enum';

export class CreateDriverDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsNotEmpty()
  @IsEnum(Gender)
  gender: Gender;

  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(15)
  phone: string;

  @IsNotEmpty()
  age: number;

  @IsOptional()
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  licenseId: string;

  @IsNotEmpty()
  licenseTypeId: number;
}
