import { PartialType } from '@nestjs/mapped-types';
import { CreateDrcDateDto } from './create-drc-date.dto';

export class UpdateDrcDateDto extends PartialType(CreateDrcDateDto) {}
