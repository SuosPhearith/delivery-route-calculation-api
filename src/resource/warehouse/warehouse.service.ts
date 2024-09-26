import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createWarehouseDto: CreateWarehouseDto) {
    try {
      const response = await this.prisma.warehouse.create({
        data: createWarehouseDto,
      });
      // Return a success response
      return {
        data: response,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle duplicate code error
      if (error.code === 'P2002') {
        throw new ConflictException('Name is already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to find all warehouses based on query parameters with pagination
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
          { information: { contains: query.toLowerCase() } }, // Search by description
        ],
      };
    }

    try {
      // Execute a transaction to fetch paginated data and count simultaneously
      const [warehouses, total] = await this.prisma.$transaction([
        // Fetch paginated list of warehouses based on the where clause
        this.prisma.warehouse.findMany({
          where,
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
        // Fetch the total count of warehouses based on the where clause
        this.prisma.warehouse.count({
          where,
        }),
      ]);

      // Return the paginated result
      return {
        data: warehouses,
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

  async findOne(id: number) {
    const data = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!data) {
      throw new NotFoundException();
    }
    return data;
  }

  async update(id: number, updateWarehouseDto: UpdateWarehouseDto) {
    try {
      const isWarehouse = await this.findOne(id);
      const updatedWarehouse = await this.prisma.warehouse.update({
        where: { id: isWarehouse.id },
        data: updateWarehouseDto,
      });

      // Return a success response
      return {
        data: updatedWarehouse,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Handle duplicate code error
      if (error.code === 'P2002') {
        throw new ConflictException('Name is already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  async remove(id: number) {
    // Verify that the.warehouse exists
    const isExist = await this.findOne(id);

    // Delete the.warehouse
    await this.prisma.warehouse.delete({ where: { id: isExist.id } });

    // Return success response
    return {
      message: 'Deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
