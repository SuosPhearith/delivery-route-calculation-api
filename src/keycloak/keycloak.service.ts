import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { SigninDto } from './dto/signin-keycloak.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class KeycloakService {
  async signin(signinDto: SigninDto) {
    try {
      const { email, password } = signinDto;
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
      params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
      params.append('username', email);
      params.append('password', password);
      const url = `${process.env.KEYCLOAK_SERVER}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response.status === 401) {
        throw new BadRequestException('Invalid email or password');
      } else if (error.response.status === 400) {
        throw new BadRequestException();
      } else {
        throw error;
      }
    }
  }

  async refresh(refreshToken: string) {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
      params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
      params.append('refresh_token', refreshToken);
      const url = `${process.env.KEYCLOAK_SERVER}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response.status === 401) {
        throw new BadRequestException('Invalid email or password');
      } else if (error.response.status === 400) {
        throw new BadRequestException();
      } else {
        throw error;
      }
    }
  }

  async introspect(token: string) {
    try {
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
      params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
      const url = `${process.env.KEYCLOAK_SERVER}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token/introspect`;
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async logout(token: string) {
    try {
      const params = new URLSearchParams();
      params.append('refresh_token', token);
      params.append('client_id', process.env.KEYCLOAK_CLIENT_ID);
      params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET);
      const url = `${process.env.KEYCLOAK_SERVER}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/logout`;
      const response = await axios.post(url, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getPublicKey() {
    try {
      const response = await axios.get(
        `${process.env.KEYCLOAK_SERVER}/realms/${process.env.KEYCLOAK_REALM}`,
      );
      const publicKey = response.data.public_key;
      return `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    } catch (error) {
      throw error;
    }
  }

  async verify(token: string) {
    try {
      const publicKey = await this.getPublicKey();
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });
      return decoded;
    } catch (error) {
      if (error.message) {
        throw new BadRequestException(error.message);
      } else {
        throw error;
      }
    }
  }
}
