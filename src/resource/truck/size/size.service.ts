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

@Injectable() // Marks this class as a provider that can be injected into other classes
export class SizeService {
  constructor(
    private readonly prisma: PrismaService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {} // Injects the PrismaService to interact with the database

  // Method to create a new truck size
  async create(
    createSizeDto: CreateSizeDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // Destructure necessary properties from the DTO
      const { name, containerLenght, containerWeight, containerHeight } =
        createSizeDto;

      // Calculate the cubic capacity of the container
      const containerCubic =
        containerLenght * containerWeight * containerHeight;

      // Create a new truck size entry in the database
      const newSize = await this.prisma.truckSize.create({
        data: {
          name,
          containerLenght,
          containerWeight,
          containerHeight,
          containerCubic,
        },
      });

      // Return success response
      return {
        data: newSize,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Check for duplicate name error
      if (error.code === 'P2002') {
        throw new ConflictException('Name already exists!');
      } else {
        throw error;
      }
    }
  }

  // Method to find all truck sizes with pagination
  async findAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit; // Calculate the number of items to skip
      const [data, total] = await this.prisma.$transaction([
        // Fetch paginated truck sizes
        this.prisma.truckSize.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of truck sizes
        this.prisma.truckSize.count(),
      ]);

      // Return the paginated result
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

  // Method to find a truck size by ID
  async findOne(id: number) {
    try {
      const truckSize = await this.prisma.truckSize.findUnique({
        where: { id }, // Find a truck size with the specified ID
      });
      if (!truckSize) {
        throw new NotFoundException(); // Throw an error if not found
      }
      // await this.cacheManager.add('key', truckSize, { ttl: 600 });
      return truckSize;
    } catch (error) {
      throw error;
    }
  }

  // Method to update an existing truck size
  async update(id: number, updateSizeDto: UpdateSizeDto) {
    try {
      // Check if the truck size exists
      const isSize = await this.findOne(id);
      if (!isSize) {
        throw new NotFoundException();
      }

      // Destructure necessary properties from the DTO
      const { name, containerLenght, containerWeight, containerHeight } =
        updateSizeDto;

      // Calculate the new cubic capacity of the container
      const containerCubic =
        containerLenght * containerWeight * containerHeight;

      // Update the truck size in the database
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

      // Return success response
      return {
        data: updatedSize,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Check for duplicate name error
      if (error.code === 'P2002') {
        throw new ConflictException('Name already exists!');
      } else {
        throw error;
      }
    }
  }

  // Method to delete an existing truck size
  async remove(id: number) {
    try {
      // Check if the truck size exists
      const isSize = await this.findOne(id);
      if (!isSize) {
        throw new NotFoundException();
      }

      // Delete the truck size from the database
      await this.prisma.truckSize.delete({
        where: { id: isSize.id },
      });

      // Return success response
      return {
        message: 'Deleted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
