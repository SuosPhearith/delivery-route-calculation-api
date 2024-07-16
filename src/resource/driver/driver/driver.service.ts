import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/global/enum/role.enum';
import { DriverStatus } from 'src/resource/enums/driver-status.enum';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';
import { ResetPasswordDto } from '../assistant/dto/reset-password.dto';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new driver
  async create(
    createDrivertDto: CreateDriverDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const {
        name,
        email,
        password,
        gender,
        phone,
        age,
        licenseId,
        licenseTypeId,
      } = createDrivertDto;
      // Check licenseTypeId
      const isLicenseTypeId = await this.prisma.licenseType.findUnique({
        where: { id: licenseTypeId },
      });
      if (!isLicenseTypeId) {
        throw new NotFoundException();
      }
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a new driver user in the database
      const driver = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: Role.driver,
          gender: gender,
          Driver: {
            create: {
              phone,
              age,
              licenseId,
              licenseTypeId,
            },
          },
        },
      });
      delete driver.password; // Remove sensitive data from the response
      return {
        data: driver,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error; // Re-throw any other errors
    }
  }

  // Find all drivers based on query parameters
  async findAll(
    query: string,
    page: number,
    limit: number,
    status: DriverStatus,
  ): Promise<ResponseAllDto<any>> {
    const skip = (page - 1) * limit;
    const baseWhere = { roleId: Role.driver };

    let where: any = {
      ...baseWhere,
    };

    if (query) {
      where = {
        ...where,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    if (status) {
      where = {
        ...where,
        Driver: {
          status,
        },
      };
    }

    try {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          include: {
            Driver: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({
          where,
        }),
      ]);

      return {
        data: users,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      // Handle any database errors
      throw error;
    }
  }

  // Find a specific driver by ID
  async findOne(id: number) {
    try {
      const isDriver = await this.prisma.user.findUnique({
        where: { id, roleId: Role.driver },
        include: {
          Driver: true,
        },
      });
      if (!isDriver) {
        throw new NotFoundException(); // Throw a 404 error if driver not found
      }
      delete isDriver.password; // Remove sensitive data from the response
      return isDriver;
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }

  // Update an existing driver
  async update(
    id: number,
    updateDriverDto: UpdateDriverDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const isUser = await this.findOne(id); // Check if driver exists
      const {
        name,
        email,
        gender,
        phone,
        age,
        status,
        licenseId,
        licenseTypeId,
      } = updateDriverDto;
      // Check licenseTypeId
      const isLicenseTypeId = await this.prisma.licenseType.findUnique({
        where: { id: licenseTypeId },
      });
      if (!isLicenseTypeId) {
        throw new NotFoundException();
      }
      // Update driver details in the database
      const driver = await this.prisma.user.update({
        where: {
          id: isUser.id,
        },
        data: {
          name,
          email,
          gender,
          Driver: {
            upsert: {
              create: {
                phone: phone,
                age: age,
                status: status,
                licenseId,
                licenseTypeId,
              },
              update: {
                phone: phone,
                age: age,
                status: status,
                licenseId,
                licenseTypeId,
              },
            },
          },
        },
        include: {
          Driver: true,
        },
      });

      delete driver.password; // Remove sensitive data from the response
      return {
        data: driver,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error; // Re-throw any other errors
    }
  }

  // Remove an driver
  async remove(id: number) {
    try {
      const isDriver = await this.findOne(id); // Check if driver exists
      await this.prisma.user.delete({ where: { id: isDriver.id } }); // Delete driver from the database
      return {
        message: 'Deleted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }

  // Toggle active driver account
  async toggle(id: number) {
    try {
      const isDriver = await this.findOne(id); // Check if driver exists
      let active: boolean;
      isDriver.status ? (active = false) : (active = true);
      await this.prisma.user.update({
        where: { id: isDriver.id },
        data: { status: active },
      }); // Delete driver from the database
      return {
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }

  // Reset password driver account
  async reset(id: number, resetPassword: ResetPasswordDto) {
    try {
      const isDriver = await this.findOne(id); // Check if driver exists
      const { password, confirmPassword } = resetPassword;
      if (password !== confirmPassword) {
        throw new BadRequestException('Check your confirm password');
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.prisma.user.update({
        where: { id: isDriver.id },
        data: { password: hashedPassword },
      });
      return {
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }
}
