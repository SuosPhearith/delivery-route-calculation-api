import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common'; // Import necessary decorators and exceptions from NestJS
import { CreateCaseDto } from './dto/create-case.dto'; // Import CreateCaseDto
import { UpdateCaseDto } from './dto/update-case.dto'; // Import UpdateCaseDto
import { PrismaService } from 'src/prisma/prisma.service'; // Import PrismaService for database operations
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto'; // Import response DTO

@Injectable()
export class CaseService {
  constructor(private readonly prisma: PrismaService) {} // Inject PrismaService

  // Method to create a new case
  async create(
    createCaseDto: CreateCaseDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // Destructure necessary properties from the DTO
      const { name, caseLenght, caseWeight, caseHeight } = createCaseDto;

      // Calculate the cubic capacity of the case
      const caseCubic = caseLenght * caseWeight * caseHeight;

      // Create a new case entry in the database
      const newCase = await this.prisma.caseSize.create({
        data: {
          name,
          caseLenght,
          caseWeight,
          caseHeight,
          caseCubic,
        },
      });

      // Return success response
      return {
        data: newCase,
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

  // Method to get all cases with pagination
  async findAll(page: number, limit: number) {
    try {
      const skip = (page - 1) * limit; // Calculate the number of items to skip
      const [data, total] = await this.prisma.$transaction([
        // Fetch paginated cases
        this.prisma.caseSize.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of cases
        this.prisma.caseSize.count(),
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

  // Method to get a specific case by ID
  async findOne(id: number) {
    try {
      const caseSize = await this.prisma.caseSize.findUnique({
        where: { id }, // Find a case with the specified ID
      });
      if (!caseSize) {
        throw new NotFoundException(); // Throw an error if not found
      }
      // await this.cacheManager.add('key', caseSize, { ttl: 600 });
      return caseSize;
    } catch (error) {
      throw error;
    }
  }

  // Method to update a specific case by ID
  async update(id: number, updateCaseDto: UpdateCaseDto) {
    try {
      // Check if the case exists
      const isSize = await this.findOne(id);
      if (!isSize) {
        throw new NotFoundException();
      }

      // Destructure necessary properties from the DTO
      const { name, caseLenght, caseWeight, caseHeight } = updateCaseDto;

      // Calculate the new cubic capacity of the case
      const caseCubic = caseLenght * caseWeight * caseHeight;

      // Update the case in the database
      const updatedSize = await this.prisma.caseSize.update({
        where: { id },
        data: {
          name,
          caseLenght,
          caseWeight,
          caseHeight,
          caseCubic,
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

  // Method to delete a specific case by ID
  async remove(id: number) {
    try {
      // Check if the case exists
      const isSize = await this.findOne(id);

      // Delete the case from the database
      await this.prisma.caseSize.delete({
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
