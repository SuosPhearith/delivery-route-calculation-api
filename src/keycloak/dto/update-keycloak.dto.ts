import { PartialType } from '@nestjs/mapped-types';
import { CreateKeycloakDto } from './create-keycloak.dto';

export class UpdateKeycloakDto extends PartialType(CreateKeycloakDto) {}
