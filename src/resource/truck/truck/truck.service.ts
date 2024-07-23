import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { KeycloakAccountRole, TruckStatus } from '@prisma/client';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';

// Decorator that marks the class as a provider that can be injected into other classes
@Injectable()
export class TruckService {
  constructor(private readonly prisma: PrismaService) {}

  // Method to get all with their ids and names
  async findAllWarehouses(): Promise<SelectDto[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      select: { id: true, name: true },
    });

    // Transform the results into the desired format for frontend usage
    const transformedTruckSizes = warehouses.map((warehouse) => ({
      value: warehouse.id,
      label: warehouse.name,
    }));

    return transformedTruckSizes;
  }

  // Method to get all with their ids and names
  async findAllZones(): Promise<SelectDto[]> {
    const zones = await this.prisma.zone.findMany({
      select: { id: true, name: true, code: true },
    });

    // Transform the results into the desired format for frontend usage
    const transformedTruckSizes = zones.map((zone) => ({
      value: zone.id,
      label: `${zone.code} (${zone.name})`,
    }));

    return transformedTruckSizes;
  }

  // Method to get all with their ids and names
  async findAllTruckSizes(): Promise<SelectDto[]> {
    const truckSizes = await this.prisma.truckSize.findMany({
      select: { id: true, name: true },
    });

    // Transform the results into the desired format for frontend usage
    const transformedTruckSizes = truckSizes.map((truckSize) => ({
      value: truckSize.id,
      label: truckSize.name,
    }));

    return transformedTruckSizes;
  }

  // Method to get all truck fuels with their ids and names
  async findAllTruckFuels(): Promise<SelectDto[]> {
    const truckFuels = await this.prisma.fuel.findMany({
      select: { id: true, name: true },
    });

    // Transform the results into the desired format for frontend usage
    const response = truckFuels.map((truckFuel) => ({
      value: truckFuel.id,
      label: truckFuel.name,
    }));

    return response;
  }

  // Method to find all drivers who are not assigned to any truck
  async findAllDrivers(): Promise<SelectDto[]> {
    // Get the IDs of drivers who are already assigned to a truck
    const assignedDriverIds = await this.prisma.truck.findMany({
      select: { driverId: true },
    });

    // Extract driver IDs into an array
    const assignedDriverIdArray = assignedDriverIds.map(
      (truck) => truck.driverId,
    );

    // Fetch drivers who are not assigned to any truck
    const availableDrivers = await this.prisma.keycloakAccount.findMany({
      where: {
        Role: KeycloakAccountRole.DRIVER,
        id: {
          notIn: assignedDriverIdArray,
        },
      },
      select: { id: true, name: true, email: true },
    });

    // Transform the results into the desired format for frontend usage
    const response = availableDrivers.map((driver) => ({
      value: driver.id,
      label: `${driver.email} (${driver.name})`,
    }));

    return response;
  }

  // Method to create a new truck
  async create(
    createTruckDto: CreateTruckDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const { truckSizeId, fuelId, driverId, zoneId, warehouseId } =
        createTruckDto;

      // Check zone
      const isZone = await this.prisma.zone.findUnique({
        where: { id: zoneId },
      });
      if (!isZone) {
        throw new BadRequestException('Invalid zone ID');
      }

      // Check warehouse
      const isWarehouse = await this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!isWarehouse) {
        throw new BadRequestException('Invalid warehouse ID');
      }

      // Check if the provided truck size ID exists
      const isTruckSizeId = await this.prisma.truckSize.findUnique({
        where: { id: truckSizeId },
      });
      if (!isTruckSizeId) {
        throw new BadRequestException('Invalid truck size ID');
      }

      // Check if the provided fuel ID exists
      const isFuelId = await this.prisma.fuel.findUnique({
        where: { id: fuelId },
      });
      if (!isFuelId) {
        throw new BadRequestException('Invalid fuel ID');
      }

      // Check if the provided driver ID exists and has the DRIVER role
      const isDriverId = await this.prisma.keycloakAccount.findUnique({
        where: { id: driverId, Role: KeycloakAccountRole.DRIVER },
      });
      if (!isDriverId) {
        throw new BadRequestException('Invalid driver ID or role');
      }

      // Create a new truck record
      const truck = await this.prisma.truck.create({ data: createTruckDto });
      return {
        data: truck,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle duplicate license plate error
      if (error.code === 'P2002') {
        throw new ConflictException('License plate already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to find all trucks based on query parameters with pagination
  async findAll(
    query: string,
    page: number,
    limit: number,
    status: TruckStatus,
  ): Promise<ResponseAllDto<any>> {
    const skip = (page - 1) * limit; // Calculate the number of items to skip for pagination

    // Initialize the where clause for filtering
    let where: any = {};

    // Add query conditions if a search query is provided
    if (query) {
      where = {
        OR: [
          { licensePlate: { contains: query, mode: 'insensitive' } }, // Search by license plate
          {
            driver: {
              name: { contains: query, mode: 'insensitive' }, // Search by driver name
            },
          },
        ],
      };
    }

    // Add status condition if a status is provided
    if (status) {
      where = {
        ...where,
        status, // Filter by status
      };
    }

    try {
      // Execute a transaction to fetch paginated data and count simultaneously
      const [trucks, total] = await this.prisma.$transaction([
        // Fetch paginated list of trucks based on the where clause
        this.prisma.truck.findMany({
          where,
          skip,
          take: limit,
          include: {
            truckSize: {
              select: {
                name: true,
              },
            },
            fuel: {
              select: {
                name: true,
              },
            },
            driver: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of trucks based on the where clause
        this.prisma.truck.count({
          where,
        }),
      ]);

      // Return the paginated result
      return {
        data: trucks,
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

  // Method to find a single truck by its ID
  async findOne(id: number) {
    const truck = await this.prisma.truck.findUnique({
      where: { id },
      include: { driver: true, fuel: true, truckSize: true }, // Include related entities
    });
    if (!truck) {
      throw new NotFoundException('Truck not found');
    }
    return truck;
  }

  // Method to update a truck by its ID
  async update(id: number, updateTruckDto: UpdateTruckDto) {
    try {
      // Verify that the truck exists
      const isTruck = await this.findOne(id);
      const { truckSizeId, fuelId, driverId, zoneId, warehouseId } =
        updateTruckDto;

      // Check zone
      const isZone = await this.prisma.zone.findUnique({
        where: { id: zoneId },
      });
      if (!isZone) {
        throw new BadRequestException('Invalid zone ID');
      }

      // Check warehouse
      const isWarehouse = await this.prisma.warehouse.findUnique({
        where: { id: warehouseId },
      });
      if (!isWarehouse) {
        throw new BadRequestException('Invalid warehouse ID');
      }

      // Check if the provided truck size ID exists
      const isTruckSizeId = await this.prisma.truckSize.findUnique({
        where: { id: truckSizeId },
      });
      if (!isTruckSizeId) {
        throw new BadRequestException('Invalid truck size ID');
      }

      // Check if the provided fuel ID exists
      const isFuelId = await this.prisma.fuel.findUnique({
        where: { id: fuelId },
      });
      if (!isFuelId) {
        throw new BadRequestException('Invalid fuel ID');
      }
      // Check if the provided driver ID exists and has the DRIVER role
      const isDriverId = await this.prisma.keycloakAccount.findUnique({
        where: { id: driverId, Role: KeycloakAccountRole.DRIVER },
      });
      if (!isDriverId) {
        throw new BadRequestException('Invalid driver ID or role');
      }

      // Update the truck record
      const truck = await this.prisma.truck.update({
        where: { id: isTruck.id },
        data: updateTruckDto,
      });
      return {
        data: truck,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Handle duplicate license plate error
      if (error.code === 'P2002') {
        throw new ConflictException('License plate already exists!');
      } else {
        throw error; // Propagate other errors
      }
    }
  }

  // Method to delete a truck by its ID
  async remove(id: number) {
    // Verify that the truck exists
    const isTruck = await this.findOne(id);
    await this.prisma.truck.delete({ where: { id: isTruck.id } });
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
