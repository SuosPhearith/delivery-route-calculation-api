import { Controller, Get, Post, Body } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { SigninDto } from './dto/signin-keycloak.dto';
import { TokenDto } from './dto/token.dto';

@Controller('api/v1/keycloak/auth')
export class KeycloakController {
  constructor(private readonly keycloakService: KeycloakService) {}

  @Post('/signin')
  async signin(@Body() signinDto: SigninDto) {
    return this.keycloakService.signin(signinDto);
  }

  @Get('/verify')
  async verify(@Body() tokenDto: TokenDto) {
    return this.keycloakService.verify(tokenDto.token);
  }

  @Post('/introspect')
  async introspect(@Body() tokenDto: TokenDto) {
    return this.keycloakService.introspect(tokenDto.token);
  }

  @Post('/logout')
  async logout(@Body() tokenDto: TokenDto) {
    return this.keycloakService.logout(tokenDto.token);
  }

  @Post('/refresh')
  async refresh(@Body() tokenDto: TokenDto) {
    return this.keycloakService.refresh(tokenDto.token);
  }
}
