import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDrcDateDto } from './dto/create-drc-date.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseDeleteDTO } from 'src/global/dto/response.delete.dto';
import { FileUploadService } from 'src/file/file-upload.service';
import * as XLSX from 'xlsx';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSubDrcDto } from './dto/create-sub-drc.dto';
import {
  Location,
  PartOfDay,
  Priority,
  TruckSize,
  TruckStatus,
} from '@prisma/client';
import { CreateTruckByDateDto } from './dto/create-truck-by-date.dto';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UnassignDto } from './dto/unassign-drc.dto';

@Injectable()
export class DrcDateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}
  async create(createDrcDateDto: CreateDrcDateDto) {
    try {
      // Validate if the date already exists
      const existingDates =
        await this.prisma.deliveryRouteCalculationDate.findMany({
          where: { date: createDrcDateDto.date },
        });

      if (existingDates.length > 0) {
        throw new ConflictException('Date already exists!');
      }

      // Create the new date entry
      const date = await this.prisma.deliveryRouteCalculationDate.create({
        data: {
          date: createDrcDateDto.date,
        },
      });

      // Fetch all trucks
      const trucks = await this.prisma.truck.findMany({
        include: {
          truckSize: true,
        },
      });

      // Create TruckByDate entries for each truck
      const truckByDateEntries = trucks.map((truck) => {
        return {
          truckId: truck.id,
          status: truck.status, // You can set other default values as needed
          capacity: truck.truckSize.containerCubic, // Assuming a default capacity, modify as per your logic
          endTime: null, // Assuming a default value for endTime, modify as per your logic
          deliveryRouteCalculationDateId: date.id,
        };
      });

      // Insert all TruckByDate entries into the database
      await this.prisma.truckByDate.createMany({
        data: truckByDateEntries,
      });

      return date;
    } catch (error) {
      // Check for duplicate name error
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
            _count: {
              select: {
                Location: true, // Count the number of trucks in each zone
              },
            },
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

  convertExcelToJson(filePath: string): any {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    return jsonData;
  }
  async createDrc(file: any, id: number) {
    try {
      const result = this.fileUploadService.handleFileUpload(file);
      const jsonData = this.convertExcelToJson(result.path);

      // Validate each DRC object
      for (const drc of jsonData) {
        const drcDto = plainToClass(CreateSubDrcDto, drc);
        const errors = await validate(drcDto);

        if (errors.length > 0) {
          throw new HttpException(
            {
              message: 'Validation failed',
              errors: errors
                .map((err) => Object.values(err.constraints))
                .flat(),
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Fetch all existing locations for the given deliveryRouteCalculationDateId
      await this.prisma.$transaction(async (prisma) => {
        const existingLocations = await prisma.location.findMany({
          where: { deliveryRouteCalculationDateId: id },
        });

        const updatedLocationIds = new Set<number>();

        const filteredDataPromises = jsonData.map(async (direction: any) => {
          const zone = await prisma.zone.findFirst({
            where: { code: direction.zone },
          });
          if (!zone) {
            throw new NotFoundException();
          }
          let truckSize: TruckSize = await prisma.truckSize.findUnique({
            where: { id: 2 },
          });
          if (direction.truckSize) {
            const IsTruckSize = await prisma.truckSize.findFirst({
              where: { name: direction.truckSize },
            });
            if (!IsTruckSize) {
              throw new NotFoundException();
            }
            truckSize = IsTruckSize;
          }

          const Meechiet = await prisma.caseSize.findFirst({
            where: { name: 'Meechiet' },
          });
          const Vital500ml = await prisma.caseSize.findFirst({
            where: { name: 'Vital500ml' },
          });
          if (!Meechiet || !Vital500ml) {
            throw new NotFoundException();
          }

          const totalCapacity =
            Meechiet.caseCubic * (direction.Meechiet * 1) +
            Vital500ml.caseCubic * (direction.Vital500ml * 1);

          const locationData = {
            documentType: direction.documentType || '',
            documentNumber: direction.documentNumber || '',
            sla: direction.sla || '',
            latitude: +direction.latitude,
            longitude: +direction.longitude,
            locationName: direction.locationName || '',
            phone: direction.phone + '' || '',
            se: direction.se || '',
            homeNo: direction.homeNo || '',
            streetNo: direction.streetNo || '',
            village: direction.village || '',
            sangkat: direction.sangkat || '',
            khan: direction.khan || '',
            hotSpot: direction.hotSpot || '',
            direction: direction.direction || '',
            area: direction.area || '',
            region: direction.region || '',
            division: direction.division || '',
            zoneId: zone.id,
            truckSizeId: truckSize?.id || null,
            deliveryDate: new Date(direction.deliveryDate),
            paymentTerm: direction.paymentTerm || '',
            comments: direction.comments || '',
            priority: direction.priority || 'LOW',
            partOfDay: direction.partOfDay || 'MORNING',
            capacity: totalCapacity,
            deliveryRouteCalculationDateId: id,
          };

          const existingLocation = existingLocations.find(
            (loc) =>
              loc.latitude === locationData.latitude &&
              loc.longitude === locationData.longitude &&
              loc.deliveryRouteCalculationDateId === id,
          );

          if (existingLocation) {
            // Recalculate capacity and split if necessary
            if (totalCapacity <= truckSize.containerCubic) {
              // Update existing location if capacity fits within one location
              const updatedLocation = await prisma.location.update({
                where: { id: existingLocation.id },
                data: locationData,
              });
              updatedLocationIds.add(updatedLocation.id);
              return updatedLocation;
            } else {
              // Delete the existing location and create new split locations
              await prisma.location.delete({
                where: { id: existingLocation.id },
              });

              const createdLocations = [];
              let remainingCapacity = totalCapacity;

              while (remainingCapacity > 0) {
                const capacityToAssign = Math.min(
                  remainingCapacity,
                  truckSize.containerCubic,
                );
                const newLocation = await prisma.location.create({
                  data: { ...locationData, capacity: capacityToAssign },
                });
                createdLocations.push(newLocation);
                remainingCapacity -= capacityToAssign;
              }

              return createdLocations;
            }
          } else {
            // No existing location, create new ones based on the capacity
            const createdLocations = [];
            let remainingCapacity = totalCapacity;

            while (remainingCapacity > 0) {
              const capacityToAssign = Math.min(
                remainingCapacity,
                truckSize.containerCubic,
              );
              const newLocation = await prisma.location.create({
                data: { ...locationData, capacity: capacityToAssign },
              });
              createdLocations.push(newLocation);
              remainingCapacity -= capacityToAssign;
            }

            return createdLocations;
          }
        });

        const allCreatedLocations = await Promise.all(filteredDataPromises);
        const flattenedLocations = allCreatedLocations.flat();

        // Delete any locations that were not updated or created
        const locationIdsToDelete = existingLocations
          .filter((loc) => !updatedLocationIds.has(loc.id))
          .map((loc) => loc.id);

        if (locationIdsToDelete.length > 0) {
          await prisma.location.deleteMany({
            where: { id: { in: locationIdsToDelete } },
          });
        }

        return {
          message: 'Locations created/updated successfully',
          locations: flattenedLocations,
        };
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Please Unassign wrong locations before reinput',
        );
      }
      throw error;
    }
  }

  async findOne(id: number) {
    return 'hello ' + id;
  }

  async getFilteredTrucks(filters: {
    deliveryRouteCalculationDateId: number;
    truckSizeId?: number;
    zoneId?: number;
    fuelId?: number;
    warehouseId?: number;
    truckOwnershipTypeId?: number;
    licensePlate?: string;
    status?: TruckStatus;
  }) {
    // return filters.deliveryRouteCalculationDateId;
    const {
      deliveryRouteCalculationDateId,
      truckSizeId,
      zoneId,
      fuelId,
      warehouseId,
      truckOwnershipTypeId,
      licensePlate,
      status,
    } = filters;

    if (
      !deliveryRouteCalculationDateId ||
      deliveryRouteCalculationDateId === undefined
    ) {
      throw new BadRequestException();
    }

    return await this.prisma.truckByDate.findMany({
      where: {
        truck: {
          ...(truckSizeId && { truckSizeId: +truckSizeId }),
          ...(zoneId && { zoneId: +zoneId }),
          ...(fuelId && { fuelId: +fuelId }),
          ...(status && { status: status }),
          ...(warehouseId && { warehouseId: +warehouseId }),
          ...(truckOwnershipTypeId && {
            truckOwnershipTypeId: +truckOwnershipTypeId,
          }),
          ...(licensePlate && {
            licensePlate: {
              contains: licensePlate,
              mode: 'insensitive', // For case-insensitive search
            },
          }),
        },
        deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
      },
      include: {
        truck: {
          include: {
            truckSize: true,
            fuel: true,
            zone: true,
            warehouse: true,
            truckOwnershipType: true,
          },
        },
      },
    });
  }

  async findAllLocations(params: {
    deliveryRouteCalculationDateId: number;
    zoneId?: number;
    truckSizeId?: number;
    partOfDay?: PartOfDay;
    priority?: Priority;
    capacity?: number;
    query?: string;
    isAssign?: string;
    truckByDateId?: string;
  }): Promise<Location[]> {
    const {
      deliveryRouteCalculationDateId,
      zoneId,
      truckSizeId,
      partOfDay,
      priority,
      capacity,
      query,
      isAssign,
      truckByDateId,
    } = params;

    if (!deliveryRouteCalculationDateId) {
      throw new BadRequestException();
    }

    if (truckByDateId) {
      const locations = await this.prisma.location.findMany({
        where: {
          AssignLocationToTruck: {
            some: {
              truckByDateId: +truckByDateId,
            },
          },
        },
        include: {
          zone: true,
          truckSize: true,
        },
      });

      // Set isAssign to true for all locations in the response
      const updatedLocations = locations.map((location) => ({
        ...location,
        isAssign: true,
      }));

      return updatedLocations;
    } else {
      // Fetch locations
      const response = await this.prisma.location.findMany({
        where: {
          deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
          ...(zoneId && { zoneId: +zoneId }),
          ...(truckSizeId && { truckSizeId: +truckSizeId }),
          ...(partOfDay && { partOfDay }),
          ...(priority && { priority }),
          ...(capacity && { capacity: { lte: +capacity } }),
          OR: query
            ? [
                {
                  phone: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                {
                  se: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
              ]
            : undefined,
        },
        include: {
          zone: true,
          truckSize: true,
        },
      });

      // Fetch assigned locations
      const AssignLocationToTruckData =
        await this.prisma.assignLocationToTruck.findMany({
          where: {
            deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
          },
        });

      // Set isAssign dynamically based on the fetched data
      const assignedLocationIds = new Set(
        AssignLocationToTruckData.map((item) => item.locationId),
      );

      const updatedResponse = response.map((location) => {
        return {
          ...location,
          isAssign: assignedLocationIds.has(location.id),
        };
      });

      // Filter response based on isAssign if the parameter was provided
      if (isAssign !== undefined) {
        const isAssignValue = isAssign === 'true';
        return updatedResponse.filter(
          (location) => location.isAssign === isAssignValue,
        );
      }

      return updatedResponse;
    }
  }

  async getAllZones(deliveryRouteCalculationDateId: number) {
    try {
      const zones = await this.prisma.zone.findMany({
        where: {
          Location: {
            some: {
              deliveryRouteCalculationDateId: deliveryRouteCalculationDateId,
            },
          },
        },
        select: {
          id: true,
          code: true,
          name: true,
        },
      });

      // Map the result to the desired format
      const result = zones.map((zone) => ({
        value: zone.id,
        label: `${zone.code} (${zone.name})`,
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  async assignLocationToTruck(
    deliveryRouteCalculationDateId: number,
    createTruckByDateDto: CreateTruckByDateDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const { truckByDateId, deliveryRouteCalculationDateIds } =
        createTruckByDateDto;

      const deliveryRouteCalculationDate =
        await this.prisma.deliveryRouteCalculationDate.findUnique({
          where: { id: deliveryRouteCalculationDateId },
          include: {
            Location: {
              select: {
                id: true,
              },
            },
            TruckByDate: {
              select: {
                id: true,
              },
            },
          },
        });

      if (!deliveryRouteCalculationDate) {
        throw new NotFoundException(
          'Delivery route calculation date not found',
        );
      }

      const locations = deliveryRouteCalculationDate.Location;
      const truckByDates = deliveryRouteCalculationDate.TruckByDate;

      // return { truckByDates, locations };

      const isTruckByDateValid = truckByDates.some(
        (truckByDate) => truckByDate.id === truckByDateId,
      );

      if (!isTruckByDateValid) {
        throw new NotFoundException('TruckByDate ID not found in TruckByDate');
      }

      const invalidLocationIds = deliveryRouteCalculationDateIds.filter(
        (id) => !locations.some((location) => location.id === id),
      );

      if (invalidLocationIds.length > 0) {
        throw new BadRequestException(
          `Invalid Location IDs: ${invalidLocationIds.join(', ')}`,
        );
      }

      // Use a transaction to ensure atomicity
      const createdEntries = await this.prisma.$transaction(
        deliveryRouteCalculationDateIds.map((locationId) => {
          return this.prisma.assignLocationToTruck.create({
            data: {
              locationId,
              truckByDateId,
              deliveryRouteCalculationDateId,
            },
          });
        }),
      );

      return {
        data: createdEntries,
        message: 'Locations successfully assigned to truck',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('A location is already assigned');
      }
      throw error;
    }
  }

  async unassignLocationToTruck(
    id: number,
    unassignDto: UnassignDto,
  ): Promise<ResponseDeleteDTO> {
    try {
      // validation
      if (unassignDto.locationIds.length <= 0) {
        throw new BadRequestException('Please input locations');
      }

      // Start a transaction
      await this.prisma.$transaction(async (prisma) => {
        for (const location of unassignDto.locationIds) {
          // Validate location
          const isLocation = await prisma.assignLocationToTruck.findFirst({
            where: {
              locationId: +location,
              deliveryRouteCalculationDateId: id,
            },
          });

          if (!isLocation) {
            throw new NotFoundException(
              `Location with ID ${location} not found`,
            );
          }

          // Delete the location assignment
          await prisma.assignLocationToTruck.delete({
            where: { id: isLocation.id },
          });
        }
      });

      return {
        message: 'Unassign successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error;
    }
  }
}
