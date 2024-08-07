import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDrcDateDto } from './dto/create-drc-date.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseDeleteDTO } from 'src/global/dto/response.delete.dto';

@Injectable()
export class DrcDateService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createDrcDateDto: CreateDrcDateDto) {
    try {
      // validate
      const existingDates =
        await this.prisma.deliveryRouteCalculationDate.findMany({
          where: { date: createDrcDateDto.date },
        });

      if (existingDates.length > 0) {
        throw new ConflictException('Date already exists!');
      }

      const date = await this.prisma.deliveryRouteCalculationDate.create({
        data: {
          date: createDrcDateDto.date,
        },
      });

      return date;
    } catch (error) {
      // Check for duplicate name error (although this part might not be necessary now)
      if (error.code === 'P2002') {
        throw new ConflictException('Date already exists!');
      } else {
        throw error;
      }
    }
  }

  async findAll(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit; // Calculate the number of items to skip for pagination

    // Initialize the where clause for filtering
    let where: any = {};

    // Add query conditions if a search query is provided
    if (query) {
      const parsedDate = new Date(query); // Attempt to parse the query as a date
      if (!isNaN(parsedDate.getTime())) {
        where = {
          date: parsedDate,
        };
      }
    }

    try {
      // Execute a transaction to fetch paginated data and count simultaneously
      const [drcDate, total] = await this.prisma.$transaction([
        // Fetch paginated list of OfficerControlls based on the where clause
        this.prisma.deliveryRouteCalculationDate.findMany({
          where,
          skip,
          take: limit,
          include: {
            DeliveryRouteCalculationDateGroupLocation: true,
          },
          orderBy: { date: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of OfficerControlls based on the where clause
        this.prisma.deliveryRouteCalculationDate.count({
          where,
        }),
      ]);

      // Return the paginated result
      return {
        data: drcDate,
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
  async remove(id: number): Promise<ResponseDeleteDTO> {
    try {
      const isDate = await this.prisma.deliveryRouteCalculationDate.findUnique({
        where: { id },
      });
      if (!isDate) {
        throw new NotFoundException();
      }
      await this.prisma.deliveryRouteCalculationDate.delete({ where: { id } });
      return {
        message: 'Deleted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
