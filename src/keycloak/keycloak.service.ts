import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { SigninDto } from './dto/signin-keycloak.dto';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';
import { KeycloakAccountRole } from '@prisma/client';

@Injectable()
export class KeycloakService {
  constructor(private readonly prisma: PrismaService) {}

  // Signin method to authenticate user and store/update user data
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

      // Retrieve user data using introspection endpoint
      const userData: KeycloakTokenResponse = await this.introspect(
        response.data?.access_token,
      );
      const { username, email: uniqueEmail, client_id, name } = userData;
      const role = userData.realm_access.roles.at(0);

      // Upsert user data in the database
      const savedUser = await this.prisma.keycloakAccount.upsert({
        where: { email: uniqueEmail }, // Check if user exists by email
        update: {
          username,
          name,
          client_id,
          Role: role,
        }, // Update existing user
        create: {
          email: uniqueEmail,
          username,
          name,
          client_id,
          Role: role,
        }, // Create new user if not found
      });

      // If upsert fails, throw an internal server error
      if (!savedUser) {
        throw new InternalServerErrorException('Cannot login');
      }

      // Return token response from Keycloak
      return response.data;
    } catch (error) {
      // Handle errors based on status code
      if (error.response.status === 401) {
        throw new BadRequestException('Invalid email or password');
      } else if (error.response.status === 400) {
        throw new BadRequestException();
      } else {
        throw error;
      }
    }
  }

  // Method to refresh the access token
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

      // Return refreshed token response from Keycloak
      return response.data;
    } catch (error) {
      // Handle errors based on status code
      if (error.response.status === 401) {
        throw new BadRequestException('Invalid email or password');
      } else if (error.response.status === 400) {
        throw new BadRequestException();
      } else {
        throw error;
      }
    }
  }

  // Method to introspect the access token
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

      // Return user data from Keycloak introspection endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Method to logout user by revoking the refresh token
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

      // Return response from Keycloak logout endpoint
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Method to retrieve public key from Keycloak
  async getPublicKey() {
    try {
      const response = await axios.get(
        `${process.env.KEYCLOAK_SERVER}/realms/${process.env.KEYCLOAK_REALM}`,
      );
      const publicKey = response.data.public_key;

      // Return formatted public key
      return `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    } catch (error) {
      throw error;
    }
  }

  // Method to verify the JWT token using Keycloak public key
  async verify(token: string) {
    try {
      const publicKey = await this.getPublicKey();
      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });

      // Return decoded token data
      return decoded;
    } catch (error) {
      // Handle verification errors
      if (error.message) {
        throw new BadRequestException(error.message);
      } else {
        throw error;
      }
    }
  }
}

// TypeScript interface representing Keycloak token response
interface KeycloakTokenResponse {
  exp: number;
  iat: number;
  jti: string;
  iss: string;
  aud: string;
  sub: string;
  typ: string;
  azp: string;
  sid: string;
  acr: string;
  'allowed-origins': string[];
  realm_access: {
    roles: KeycloakAccountRole[];
  };
  resource_access: {
    account: {
      roles: string[];
    };
  };
  scope: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  client_id: string;
  username: string;
  token_type: string;
  active: boolean;
}
