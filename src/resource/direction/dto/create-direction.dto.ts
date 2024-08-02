import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDirectionDto {
  @IsNotEmpty()
  @IsString()
  note: string;
}
