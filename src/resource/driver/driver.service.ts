import { Injectable } from '@nestjs/common';
import { KeycloakAccountRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService) {}
  async getData(user: any) {
    // find by email
    const { email } = user;
    const userInfo = await this.prisma.keycloakAccount.findUnique({
      where: { email },
    });
    // select truck
    if (user.role === KeycloakAccountRole.DRIVER) {
      const data = await this.prisma.truckDriver.findMany({
        where: { driverId: userInfo.id },
        include: {
          truck: {
            include: {
              truckSize: true,
              warehouse: true,
              truckOwnershipType: true,
              zone: true,
              fuel: true,
            },
          },
        },
      });
      return {
        data: data,
      };
    } else {
      const data = await this.prisma.truckAssistant.findMany({
        where: { assistantId: userInfo.id },
        include: {
          truck: {
            include: {
              truckSize: true,
              warehouse: true,
              truckOwnershipType: true,
              zone: true,
              fuel: true,
            },
          },
        },
      });
      return {
        data: data,
      };
    }
  }
}
