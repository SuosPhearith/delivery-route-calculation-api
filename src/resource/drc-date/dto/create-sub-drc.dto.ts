import { Flag, PartOfDay, Priority } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubDrcDto {
  @IsString()
  @IsOptional()
  paymentTerm?: string;

  @IsString()
  @IsOptional()
  deliveryDate: string;

  @IsString()
  @IsOptional()
  se?: string;

  @Transform(({ value }) => String(value))
  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  locationName?: string;

  @IsString()
  @IsOptional()
  truckSize?: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  latitude: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  partOfDay?: PartOfDay;

  @IsString()
  @IsOptional()
  priority?: Priority;

  @IsString()
  @IsOptional()
  zone?: string;

  @IsString()
  @IsOptional()
  documentType?: string;

  @IsString()
  @IsOptional()
  documentNumber?: string;

  //   @IsDateString()
  documentDate: string;

  @IsString()
  @IsOptional()
  sla?: string;

  @IsString()
  @IsOptional()
  uploaddTime?: string;

  @IsString()
  @IsOptional()
  homeNo?: string;

  @IsString()
  @IsOptional()
  streetNo?: string;

  @IsString()
  @IsOptional()
  village?: string;

  @IsString()
  @IsOptional()
  sangkat?: string;

  @IsString()
  @IsOptional()
  khan?: string;

  @IsString()
  @IsOptional()
  hotSpot?: string;

  @IsString()
  @IsOptional()
  direction?: string;

  @IsString()
  @IsOptional()
  area?: string;

  @IsString()
  @IsOptional()
  region?: string;

  @IsString()
  @IsOptional()
  division?: string;

  @IsString()
  @IsOptional()
  comments?: string;

  @IsString()
  @IsOptional()
  licensePlate?: string;

  @IsString()
  @IsOptional()
  flag?: Flag;

  @IsString()
  @IsOptional()
  code?: string;
}
