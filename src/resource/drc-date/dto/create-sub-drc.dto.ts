import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubDrcDto {
  @IsString()
  @IsOptional()
  paymentTerm?: string;

  //   @IsString()
  deliveryDate: string;

  @Transform(({ value }) => parseInt(value))
  //   @IsNumber()
  Vital500ml: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  Meechiet: number;

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
  partOfDay?: string;

  @IsString()
  @IsOptional()
  priority?: string;

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
  uploadedTime?: string;

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
}
