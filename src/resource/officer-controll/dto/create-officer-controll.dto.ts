import { IsOptional } from 'class-validator';

export class CreateOfficerControllDto {
  @IsOptional()
  description: string;
}
