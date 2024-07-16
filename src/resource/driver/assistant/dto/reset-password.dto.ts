import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  confirmPassword: string;
}
