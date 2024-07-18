import { SetMetadata } from '@nestjs/common';

export const KEYCLOAK_ROLES_KEY = 'keycloak-roles';

export const KeycloakRoles = (...args: string[]) =>
  SetMetadata('keycloak-roles', args);
