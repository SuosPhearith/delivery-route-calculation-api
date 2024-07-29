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
import { ReassignAssistantDto } from './dto/reassign-assistant.dto';
import { ReassignDriverDto } from './dto/reassign-driver.dto';

// Decorator that marks the class as a provider that can be injected into other classes
@Injectable()
export class TruckService {
  constructor(private readonly prisma: PrismaService) {}

  // Method to get all with their ids and names
  async findAllTruckOwnershipTypes(): Promise<SelectDto[]> {
    const truckOwnershipTypes = await this.prisma.truckOwnershipType.findMany({
      select: { id: true, name: true },
    });

    // Transform the results into the desired format for frontend usage
    const data = truckOwnershipTypes.map((truckOwnershipType) => ({
      value: truckOwnershipType.id,
      label: truckOwnershipType.name,
    }));

    return data;
  }

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
    // Fetch drivers who are not assigned to any truck
    const drivers = await this.prisma.keycloakAccount.findMany({
      where: {
        Role: KeycloakAccountRole.DRIVER,
      },
      select: { id: true, name: true, email: true },
    });

    // Transform the results into the desired format for frontend usage
    const response = drivers.map((driver) => ({
      value: driver.id,
      label: `${driver.email} (${driver.name})`,
    }));

    return response;
  }

  // Method to find all asssistants who are not assigned to any truck
  async findAllAssistants(): Promise<SelectDto[]> {
    // Fetch asssistants who are not assigned to any truck
    const asssistants = await this.prisma.keycloakAccount.findMany({
      where: {
        Role: KeycloakAccountRole.ASSISTANT,
      },
      select: { id: true, name: true, email: true },
    });

    // Transform the results into the desired format for frontend usage
    const response = asssistants.map((assistant) => ({
      value: assistant.id,
      label: `${assistant.email} (${assistant.name})`,
    }));

    return response;
  }

  async create(
    createTruckDto: CreateTruckDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const {
        truckSizeId,
        fuelId,
        driver,
        assistant,
        zoneId,
        warehouseId,
        truckOwnershipTypeId,
        licensePlate,
        model,
        manufacturer,
        functioning,
      } = createTruckDto;

      // Start a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Check if the provided driver ID exists and has the DRIVER role
        for (const driverId of driver) {
          const isDriverId = await prisma.keycloakAccount.findUnique({
            where: { id: driverId, Role: KeycloakAccountRole.DRIVER },
          });
          if (!isDriverId) {
            throw new BadRequestException('Invalid driver ID or role');
          }
        }

        // Check if the provided assistant ID exists and has the ASSISTANT role
        for (const assistantId of assistant) {
          const isAssistantId = await prisma.keycloakAccount.findUnique({
            where: { id: assistantId, Role: KeycloakAccountRole.ASSISTANT },
          });
          if (!isAssistantId) {
            throw new BadRequestException('Invalid assistant ID or role');
          }
        }

        // Check truckOwnershipType
        const isTruckOwnershipType = await prisma.truckOwnershipType.findUnique(
          {
            where: { id: truckOwnershipTypeId },
          },
        );
        if (!isTruckOwnershipType) {
          throw new BadRequestException('Invalid truckOwnershipType ID');
        }

        // Check zone
        const isZone = await prisma.zone.findUnique({
          where: { id: zoneId },
        });
        if (!isZone) {
          throw new BadRequestException('Invalid zone ID');
        }

        // Check warehouse
        const isWarehouse = await prisma.warehouse.findUnique({
          where: { id: warehouseId },
        });
        if (!isWarehouse) {
          throw new BadRequestException('Invalid warehouse ID');
        }

        // Check if the provided truck size ID exists
        const isTruckSizeId = await prisma.truckSize.findUnique({
          where: { id: truckSizeId },
        });
        if (!isTruckSizeId) {
          throw new BadRequestException('Invalid truck size ID');
        }

        // Check if the provided fuel ID exists
        const isFuelId = await prisma.fuel.findUnique({
          where: { id: fuelId },
        });
        if (!isFuelId) {
          throw new BadRequestException('Invalid fuel ID');
        }

        // Create a new truck record
        const truck = await prisma.truck.create({
          data: {
            truckSizeId,
            fuelId,
            licensePlate,
            model,
            manufacturer,
            functioning,
            zoneId,
            warehouseId,
            truckOwnershipTypeId,
          },
        });

        // Assign assistants to the truck
        for (const assistantId of assistant) {
          await prisma.truckAssistant.create({
            data: { truckId: truck.id, assistantId: assistantId },
          });
        }

        // Assign drivers to the truck
        for (const driverId of driver) {
          await prisma.truckDriver.create({
            data: { truckId: truck.id, driverId: driverId },
          });
        }
      });

      return {
        data: {},
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
            zone: true,
            truckOwnershipType: true,
            warehouse: true,
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
            TruckDriver: {
              select: {
                driver: true,
              },
            },
            TruckAssistant: {
              select: {
                assistant: true,
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
      include: {
        TruckDriver: true,
        fuel: true,
        truckSize: true,
        TruckAssistant: true,
      }, // Include related entities
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

      const {
        truckSizeId,
        fuelId,
        zoneId,
        warehouseId,
        truckOwnershipTypeId,
        licensePlate,
        model,
        manufacturer,
        functioning,
      } = updateTruckDto;

      // Start a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Check truckOwnershipType
        const isTruckOwnershipType = await prisma.truckOwnershipType.findUnique(
          {
            where: { id: truckOwnershipTypeId },
          },
        );
        if (!isTruckOwnershipType) {
          throw new BadRequestException('Invalid truckOwnershipType ID');
        }

        // Check zone
        const isZone = await prisma.zone.findUnique({
          where: { id: zoneId },
        });
        if (!isZone) {
          throw new BadRequestException('Invalid zone ID');
        }

        // Check warehouse
        const isWarehouse = await prisma.warehouse.findUnique({
          where: { id: warehouseId },
        });
        if (!isWarehouse) {
          throw new BadRequestException('Invalid warehouse ID');
        }

        // Check if the provided truck size ID exists
        const isTruckSizeId = await prisma.truckSize.findUnique({
          where: { id: truckSizeId },
        });
        if (!isTruckSizeId) {
          throw new BadRequestException('Invalid truck size ID');
        }

        // Check if the provided fuel ID exists
        const isFuelId = await prisma.fuel.findUnique({
          where: { id: fuelId },
        });
        if (!isFuelId) {
          throw new BadRequestException('Invalid fuel ID');
        }

        // Update the truck record
        const truck = await prisma.truck.update({
          where: { id: isTruck.id },
          data: {
            truckSizeId,
            fuelId,
            licensePlate,
            model,
            manufacturer,
            functioning,
            zoneId,
            warehouseId,
            truckOwnershipTypeId,
          },
        });

        return {
          data: truck,
          message: 'Updated successfully',
          statusCode: HttpStatus.OK,
        };
      });
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

  async reassignAssistant(
    id: number,
    reassignAssistantDto: ReassignAssistantDto,
  ) {
    try {
      // Start a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Check if truck ID exists
        const isTruck = await prisma.truck.findUnique({ where: { id } });
        if (!isTruck) {
          throw new NotFoundException();
        }

        // Delete existing truck assistants
        await prisma.truckAssistant.deleteMany({ where: { truckId: id } });

        const { assistant } = reassignAssistantDto;
        if (assistant.length <= 0) {
          throw new BadRequestException('Please input assistant');
        }

        // Check if the provided assistant ID exists and has the ASSISTANT role
        for (const assistantId of assistant) {
          const isAssistantId = await prisma.keycloakAccount.findUnique({
            where: { id: assistantId, Role: KeycloakAccountRole.ASSISTANT },
          });
          if (!isAssistantId) {
            throw new BadRequestException('Invalid assistant ID or role');
          }
        }

        // Assign new assistants to the truck
        for (const assistantId of assistant) {
          await prisma.truckAssistant.create({
            data: { truckId: id, assistantId: assistantId },
          });
        }
      });

      return {
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }

  async reassignDriver(id: number, reassignDriverDto: ReassignDriverDto) {
    try {
      // Check if truck ID exists
      const isTruck = await this.prisma.truck.findUnique({ where: { id } });
      if (!isTruck) {
        throw new NotFoundException();
      }

      const { driver } = reassignDriverDto;
      if (driver.length <= 0) {
        throw new BadRequestException('Please input driver');
      }

      // Start a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Delete existing truck drivers
        await prisma.truckDriver.deleteMany({ where: { truckId: id } });

        // Check if the provided driver ID exists and has the DRIVER role
        for (const driverId of driver) {
          const isDriverId = await prisma.keycloakAccount.findUnique({
            where: { id: driverId, Role: KeycloakAccountRole.DRIVER },
          });
          if (!isDriverId) {
            throw new BadRequestException('Invalid driver ID or role');
          }
        }

        // Assign new drivers to the truck
        for (const driverId of driver) {
          await prisma.truckDriver.create({
            data: { truckId: id, driverId: driverId },
          });
        }
      });

      return {
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}

// DTO used for transforming select data
type SelectDto = {
  value: number; // or number, depending on your actual id type
  label: string;
};
