import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfficerControllDto } from './dto/create-officer-controll.dto';
import { UpdateOfficerControllDto } from './dto/update-officer-controll.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';

@Injectable()
export class OfficerControllService {
  constructor(private readonly prisma: PrismaService) {}

  // Method to create a new OfficerControll
  async create(
    createOfficerControllDto: CreateOfficerControllDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // Find the last created OfficerControll to determine the next code
      const lastOfficerControll = await this.prisma.officerControll.findFirst({
        orderBy: { id: 'desc' },
      });

      // Initialize the new code to 'OFC0001'
      let newCode = 'OFC0001';

      // If there is a previous OfficerControll, generate the next code in sequence
      if (lastOfficerControll) {
        const lastCode = lastOfficerControll.name;
        const codeNumber = parseInt(lastCode.slice(3), 10) + 1;
        newCode = `OFC${codeNumber.toString().padStart(4, '0')}`;
      }

      // Create a new OfficerControll record in the database
      const ofc = await this.prisma.officerControll.create({
        data: {
          name: newCode,
          description: createOfficerControllDto.description,
        },
      });

      // Return a success response
      return {
        data: ofc,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle duplicate name error
      if (error.code === 'P2002') {
        throw new ConflictException('OfficerControll already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to find all OfficerControlls based on query parameters with pagination
  async findAll(
    query: string,
    page: number,
    limit: number,
  ): Promise<ResponseAllDto<any>> {
    const skip = (page - 1) * limit; // Calculate the number of items to skip for pagination

    // Initialize the where clause for filtering
    let where: any = {};

    // Add query conditions if a search query is provided
    if (query) {
      where = {
        OR: [
          { name: { contains: query.toLowerCase() } }, // Search by name
          { description: { contains: query.toLowerCase() } }, // Search by description
        ],
      };
    }

    try {
      // Execute a transaction to fetch paginated data and count simultaneously
      const [officerControlls, total] = await this.prisma.$transaction([
        // Fetch paginated list of OfficerControlls based on the where clause
        this.prisma.officerControll.findMany({
          where,
          skip,
          take: limit,
          include: {
            Zone: true,
          },
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of OfficerControlls based on the where clause
        this.prisma.officerControll.count({
          where,
        }),
      ]);

      // Return the paginated result
      return {
        data: officerControlls,
        totalCount: total,
        totalPages: Math.ceil(total / limit), // Calculate total pages
        page,
        limit,
      };
    } catch (error) {
      // Handle any database errors
      throw error;
    }
  }

  // Method to find a single OfficerControll by ID
  async findOne(id: number) {
    const officerControll = await this.prisma.officerControll.findUnique({
      where: { id },
    });
    if (!officerControll) {
      throw new NotFoundException();
    }
    return officerControll;
  }

  // Method to update an OfficerControll by ID
  async update(
    id: number,
    updateOfficerControllDto: UpdateOfficerControllDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // Find the existing OfficerControll
      const isOfc = await this.findOne(id);

      // Update the OfficerControll with the new data
      const updatedOfc = await this.prisma.officerControll.update({
        where: { id: isOfc.id },
        data: {
          description: updateOfficerControllDto.description,
        },
      });

      // Return a success response
      return {
        data: updatedOfc,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }

  // Method to delete an OfficerControll by ID
  async remove(id: number) {
    // Verify that the OfficerControll exists
    const isOfc = await this.findOne(id);

    // Delete the OfficerControll
    await this.prisma.officerControll.delete({ where: { id: isOfc.id } });

    // Return success response
    return {
      message: 'Deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
