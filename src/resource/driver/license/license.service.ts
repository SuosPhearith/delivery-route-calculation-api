import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';

@Injectable()
export class LicenseService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    createLicenseDto: CreateLicenseDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const license = await this.prisma.licenseType.create({
        data: createLicenseDto,
      });
      return {
        data: license,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      throw error;
    }
  }

  async findAll(page: number, limit: number): Promise<ResponseAllDto<any>> {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await this.prisma.$transaction([
        this.prisma.licenseType.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        this.prisma.licenseType.count(),
      ]);

      return {
        data: data,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      const licenseType = await this.prisma.licenseType.findUnique({
        where: { id },
      });
      if (!licenseType) {
        throw new NotFoundException();
      }
      return licenseType;
    } catch (error) {
      throw error;
    }
  }

  async update(
    id: number,
    updateLicenseDto: UpdateLicenseDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const isLicenseType = await this.findOne(id);
      const updatedLicenseType = await this.prisma.licenseType.update({
        where: { id: isLicenseType.id },
        data: updateLicenseDto,
      });
      return {
        data: updatedLicenseType,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const isLicenseType = await this.findOne(id);
      await this.prisma.licenseType.delete({
        where: { id: isLicenseType.id },
      });
      return {
        message: 'Deleted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
