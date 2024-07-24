import { IsArray, IsNotEmpty } from 'class-validator';

export class ReassignAssistantDto {
  @IsNotEmpty()
  @IsArray()
  assistant: number[];
}
