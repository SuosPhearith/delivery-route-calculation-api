import { IsNotEmpty, MinLength } from 'class-validator';

export class CreateLicenseDto {
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsNotEmpty()
  @MinLength(1)
  description: string;
}
