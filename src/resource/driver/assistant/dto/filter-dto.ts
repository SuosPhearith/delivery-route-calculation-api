import { IsOptional } from 'class-validator';
import { SearchDto } from 'src/global/dto/search.dto';
import { DriverStatus } from 'src/resource/enums/driver-status.enum';

export class FilterDto extends SearchDto {
  @IsOptional()
  status: DriverStatus;
}
