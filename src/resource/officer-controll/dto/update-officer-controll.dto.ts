import { PartialType } from '@nestjs/mapped-types';
import { CreateOfficerControllDto } from './create-officer-controll.dto';

export class UpdateOfficerControllDto extends PartialType(CreateOfficerControllDto) {}
