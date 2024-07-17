import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';

@Injectable()
export class SizeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createSizeDto: CreateSizeDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const { name, containerLenght, containerWeight, containerHeight } =
        createSizeDto;
      const containerCubic =
        containerLenght * containerWeight * containerHeight;
      const newSize = await this.prisma.truckSize.create({
        data: {
          name,
          containerLenght,
          containerWeight,
          containerHeight,
          containerCubic,
        },
      });
      return {
        data: newSize,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      //check if duplicate
      if (error.code === 'P2002') {
        throw new ConflictException('Name is already exist!');
      } else {
        throw error;
      }
    }
  }

  async findAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await this.prisma.$transaction([
        this.prisma.truckSize.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        this.prisma.truckSize.count(),
      ]);

      return {
        data,
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
      const truckSize = await this.prisma.truckSize.findUnique({
        where: { id },
      });
      if (!truckSize) {
        throw new NotFoundException();
      }
      return truckSize;
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateSizeDto: UpdateSizeDto) {
    try {
      // Validation
      const isSize = await this.findOne(id);
      if (!isSize) {
        throw new NotFoundException();
      }
      const { name, containerLenght, containerWeight, containerHeight } =
        updateSizeDto;
      const containerCubic =
        containerLenght * containerWeight * containerHeight;
      const updatedSize = await this.prisma.truckSize.update({
        where: { id },
        data: {
          name,
          containerLenght,
          containerWeight,
          containerHeight,
          containerCubic,
        },
      });
      return {
        data: updatedSize,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      //check if duplicate
      if (error.code === 'P2002') {
        throw new ConflictException('Name is already exist!');
      } else {
        throw error;
      }
    }
  }

  async remove(id: number) {
    try {
      const isSizze = await this.findOne(id);
      await this.prisma.truckSize.delete({
        where: { id: isSizze.id },
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
