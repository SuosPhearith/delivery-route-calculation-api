import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTruckOwnershipTypeDto } from './dto/create-truck-ownership-type.dto';
import { UpdateTruckOwnershipTypeDto } from './dto/update-truck-ownership-type.dto';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TruckOwnershipTypeService {
  constructor(private readonly prisma: PrismaService) {}

  // Method to create a new TruckOwnershipType entry
  async create(
    createTruckOwnershipTypeDto: CreateTruckOwnershipTypeDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // Create the new TruckOwnershipType using Prisma
      const data = await this.prisma.truckOwnershipType.create({
        data: createTruckOwnershipTypeDto,
      });
      // Return success response
      return {
        data,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle unique constraint violation error
      if (error.code === 'P2002') {
        throw new ConflictException('Name already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to fetch all TruckOwnershipType entries with pagination
  async findAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit; // Calculate the number of items to skip
      const [data, total] = await this.prisma.$transaction([
        // Fetch paginated truck ownership types
        this.prisma.truckOwnershipType.findMany({
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                Truck: true, // Count the number of trucks in each zone
              },
            },
          },
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of truck ownership types
        this.prisma.truckOwnershipType.count(),
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

  // Method to fetch a single TruckOwnershipType entry by ID
  async findOne(id: number) {
    const data = await this.prisma.truckOwnershipType.findUnique({
      where: { id },
      include: { Truck: true },
    });
    if (!data) {
      throw new NotFoundException(); // Throw error if not found
    }
    return data;
  }

  // Method to update a TruckOwnershipType entry by ID
  async update(
    id: number,
    updateTruckOwnershipTypeDto: UpdateTruckOwnershipTypeDto,
  ) {
    try {
      await this.findOne(id); // Check if the entry exists
      const data = await this.prisma.truckOwnershipType.update({
        where: { id },
        data: updateTruckOwnershipTypeDto,
      });
      // Return success response
      return {
        data,
        message: 'Updated successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle unique constraint violation error
      if (error.code === 'P2002') {
        throw new ConflictException('Name already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to delete a TruckOwnershipType entry by ID
  async remove(id: number) {
    // Check if the entry exists
    const isT = await this.findOne(id);

    // Delete the entry from the database
    await this.prisma.truckOwnershipType.delete({
      where: { id: isT.id },
    });

    // Return success response
    return {
      message: 'Deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
