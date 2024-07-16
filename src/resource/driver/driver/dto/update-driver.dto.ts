import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from 'src/auth/enum/gender.enum';
import { DriverStatus } from 'src/resource/enums/driver-status.enum';

export class UpdateDriverDto {
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
