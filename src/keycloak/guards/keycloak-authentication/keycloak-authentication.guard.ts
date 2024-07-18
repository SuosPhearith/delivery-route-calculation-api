import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { KeycloakService } from 'src/keycloak/keycloak.service';

@Injectable()
export class KeycloakAuthenticationGuard implements CanActivate {
  constructor(private readonly keycloakService: KeycloakService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      //get header
      const request = context.switchToHttp().getRequest();
      const authorizationHeader = request.headers['authorization'];
      if (!authorizationHeader) return false;
      //get token
      const token: string = authorizationHeader.split(' ')[1];
      if (!token) return false;
      //check token
      const isActive = await this.keycloakService.introspect(token);

      if (!isActive.active) {
        return false;
      }
      request.user = isActive;
      return true;
    } catch (error) {
      return false;
    }
  }
}
