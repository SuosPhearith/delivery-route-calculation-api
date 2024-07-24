import { PartialType } from '@nestjs/mapped-types';
import { CreateTruckOwnershipTypeDto } from './create-truck-ownership-type.dto';

export class UpdateTruckOwnershipTypeDto extends PartialType(CreateTruckOwnershipTypeDto) {}
