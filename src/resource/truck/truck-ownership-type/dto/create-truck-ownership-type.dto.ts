import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTruckOwnershipTypeDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;
}
