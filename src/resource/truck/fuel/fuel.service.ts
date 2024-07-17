import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable() // Marks this class as a provider that can be injected into other classes
export class FuelService {
  constructor(private readonly prisma: PrismaService) {} // Injects the PrismaService to interact with the database

  // Method to create a new fuel entry
  async create(createFuelDto: CreateFuelDto) {
    try {
      // Create a new fuel entry in the database
      const newFuel = await this.prisma.fuel.create({ data: createFuelDto });

      // Return success response
      return {
        data: newFuel,
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

  // Method to fetch all fuel entries with pagination
  async findAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit; // Calculate the number of items to skip
      const [data, total] = await this.prisma.$transaction([
        // Fetch paginated fuel entries
        this.prisma.fuel.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of fuel entries
        this.prisma.fuel.count(),
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

  // Method to fetch a single fuel entry by ID
  async findOne(id: number) {
    try {
      const fuel = await this.prisma.fuel.findUnique({
        where: { id },
      });
      if (!fuel) {
        throw new NotFoundException();
      }
      return fuel;
    } catch (error) {
      throw error;
    }
  }

  // Method to update an existing fuel entry
  async update(id: number, updateFuelDto: UpdateFuelDto) {
    try {
      // Check if the fuel entry exists
      const isFuel = await this.findOne(id);

      // Update the fuel entry in the database
      const updatedFuel = await this.prisma.fuel.update({
        where: { id: isFuel.id },
        data: updateFuelDto,
      });

      // Return success response
      return {
        data: updatedFuel,
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

  // Method to delete a fuel entry
  async remove(id: number) {
    try {
      // Check if the fuel entry exists
      const isFuel = await this.findOne(id);

      // Delete the fuel entry from the database
      await this.prisma.fuel.delete({
        where: { id: isFuel.id },
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
