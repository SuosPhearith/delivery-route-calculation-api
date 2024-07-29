import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';

@Injectable()
export class ZoneService {
  constructor(private readonly prisma: PrismaService) {}

  // Method to get all truck sizes with their ids and names
  async findAllOfficerControll(): Promise<SelectDto[]> {
    const ofc = await this.prisma.officerControll.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'desc' },
    });

    // Transform the results into the desired format for frontend usage
    const data = ofc.map((truckSize) => ({
      value: truckSize.id,
      label: truckSize.name,
    }));

    return data;
  }

  // Method to create a new Zone
  async create(
    createZoneDto: CreateZoneDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // validate officerControllId
      const isofficerControllId = await this.prisma.officerControll.findUnique({
        where: { id: createZoneDto.officerControllId },
      });
      if (!isofficerControllId) {
        throw new NotFoundException();
      }
      // Find the last created Zone to determine the next code
      const lastDelivery = await this.prisma.zone.findFirst({
        orderBy: { id: 'desc' },
      });

      // Initialize the new code to 'DEL0001'
      let newCode = 'DEL0001';

      // If there is a previous Zone, generate the next code in sequence
      if (lastDelivery) {
        const lastCode = lastDelivery.code;
        const codeNumber = parseInt(lastCode.slice(3), 10) + 1;
        newCode = `DEL${codeNumber.toString().padStart(4, '0')}`;
      }
      // Combine the new code with the other data to be stored
      const dataToStore = { ...createZoneDto, code: newCode };

      // Create a new Zone record in the database
      const zone = await this.prisma.zone.create({ data: dataToStore });

      // Return a success response
      return {
        data: zone,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle duplicate code error
      if (error.code === 'P2002') {
        throw new ConflictException('Zone with this code already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to find all zones based on query parameters with pagination
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
          { name: { contains: query, mode: 'insensitive' } }, // Search by name
          { description: { contains: query, mode: 'insensitive' } }, // Search by description
          { code: { contains: query, mode: 'insensitive' } }, // Search by code
          {
            officerControll: {
              name: { contains: query, mode: 'insensitive' }, // Search by officerControll name
            },
          },
        ],
      };
    }

    try {
      // Execute a transaction to fetch paginated data and count simultaneously
      const [zones, total] = await this.prisma.$transaction([
        // Fetch paginated list of zones based on the where clause
        this.prisma.zone.findMany({
          where,
          skip,
          take: limit,
          include: {
            officerControll: true,
            Truck: true,
          },
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of zones based on the where clause
        this.prisma.zone.count({
          where,
        }),
      ]);

      // Return the paginated result
      return {
        data: zones,
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

  // Method to find a single zone by ID
  async findOne(id: number) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException();
    }
    return zone;
  }

  // Method to update a zone by ID
  async update(
    id: number,
    updateZoneDto: UpdateZoneDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // validate officerControllId
      const isofficerControllId = await this.prisma.officerControll.findUnique({
        where: { id: updateZoneDto.officerControllId },
      });
      if (!isofficerControllId) {
        throw new NotFoundException();
      }
      // Find the existing zone
      const zone = await this.findOne(id);

      // Update the zone with the new data
      const updatedZone = await this.prisma.zone.update({
        where: { id: zone.id },
        data: updateZoneDto,
      });

      // Return a success response
      return {
        data: updatedZone,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Handle duplicate code error
      if (error.code === 'P2002') {
        throw new ConflictException('Zone with this code already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to delete a zone by ID
  async remove(id: number) {
    // Verify that the zone exists
    const isZone = await this.findOne(id);

    // Delete the zone
    await this.prisma.zone.delete({ where: { id: isZone.id } });

    // Return success response
    return {
      message: 'Deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}

// DTO used for transforming select data
type SelectDto = {
  value: number; // or number, depending on your actual id type
  label: string;
};
