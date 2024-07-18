import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { KEYCLOAK_ROLES_KEY } from '../../decorators/keycloak-roles/keycloak-roles.decorator';

@Injectable()
export class KeycloakAuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const roles = this.reflector.getAllAndOverride<string[]>(
        KEYCLOAK_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (roles.length === 0) return true; // If no roles are required, allow access

      const request = context.switchToHttp().getRequest();
      const user = request.user;
      if (!user || !user.realm_access || !user.realm_access.roles) return false;

      const userRoles = user.realm_access.roles;

      return roles.some((role) => userRoles.includes(role));
    } catch (error) {
      console.error('Authorization error:', error);
      return false;
    }
  }
}
