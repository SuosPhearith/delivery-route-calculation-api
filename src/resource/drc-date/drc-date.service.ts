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
        const oldLocations = await prisma.location.findMany({
          where: { deliveryRouteCalculationDateId: id },
        });
        // check to delete
        const oldLocationsForCheck = await prisma.location.findMany({
          where: { deliveryRouteCalculationDateId: id },
          select: {
            id: true,
            latitude: true,
            longitude: true,
            deliveryRouteCalculationDateId: true,
          },
        });
        const filteredIds = oldLocationsForCheck
          .filter((oldLoc) => {
            // Check if the location in oldLocationsForCheck exists in jsonData
            const existsInJsonData = jsonData.some(
              (newLoc) =>
                newLoc.latitude === oldLoc.latitude &&
                newLoc.longitude === oldLoc.longitude,
            );

            // Return true if it does NOT exist in jsonData (i.e., we want to keep it)
            return !existsInJsonData;
          })
          .map((oldLoc) => oldLoc.id); // Extract the ids of the filtered locations

        if (filteredIds.length > 0) {
          // console.log(filteredIds);
          // for (const location of filteredIds) {
          //   console.log(location + '  ' + id);
          //   // find to delete in assign
          //   const isAssignedLocation =
          //     await prisma.assignLocationToTruck.findFirst({
          //       where: {
          //         locationId: location,
          //         deliveryRouteCalculationDateId: id,
          //       },
          //     });
          //   console.log(isAssignedLocation);
          //   if (isAssignedLocation) {
          //     await prisma.assignLocationToTruck.delete({
          //       where: {
          //         id: isAssignedLocation.id,
          //       },
          //     });
          //   }
          //   await this.prisma.location.delete({
          //     where: {
          //       id: location,
          //     },
          //   });
          // }
          for (const location of filteredIds) {
            console.log(location + '  ' + id);

            // Delete all related AssignLocationToTruck entries before deleting the location
            await prisma.assignLocationToTruck.deleteMany({
              where: {
                locationId: location,
                deliveryRouteCalculationDateId: id,
              },
            });

            // Now delete the location
            await prisma.location.delete({
              where: {
                id: location,
              },
            });
          }
        }
        for (const direction of jsonData) {
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
          const numberOfSplite = Math.ceil(
            totalCapacity / truckSize.containerCubic,
          );
          const matchingLocation = oldLocations.find(
            (loc) =>
              loc.latitude === locationData.latitude &&
              loc.longitude === locationData.longitude &&
              loc.deliveryRouteCalculationDateId ===
                locationData.deliveryRouteCalculationDateId,
          );
          if (matchingLocation) {
            const { capacity, ...updateData } = locationData;
            const oldCapacity = await prisma.location.findMany({
              where: {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                deliveryRouteCalculationDateId:
                  locationData.deliveryRouteCalculationDateId,
              },
              select: {
                capacity: true,
                id: true,
              },
            });
            // Sum the capacities
            const totalOldCapacity = oldCapacity.reduce(
              (total, { capacity }) => total + capacity,
              0,
            );
            // Extract an array of ids
            const ids = oldCapacity.map(({ id }) => id);
            const epsilon = 1e-10; // A small tolerance value
            const areEqual = Math.abs(totalOldCapacity - capacity) < epsilon;
            if (areEqual) {
              await prisma.location.updateMany({
                where: {
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  deliveryRouteCalculationDateId:
                    locationData.deliveryRouteCalculationDateId,
                },
                data: updateData,
              });
            } else {
              // unassign
              const getAssignedIds =
                await prisma.assignLocationToTruck.findMany({
                  where: { deliveryRouteCalculationDateId: id },
                  select: { locationId: true },
                });
              // Extract an array of ids
              const assignedIds = getAssignedIds.map(
                ({ locationId }) => locationId,
              );
              const filteredIds: UnassignDto = {
                locationIds: ids.filter((id) => assignedIds.includes(id)),
              };
              if (assignedIds.length > 0) {
                await this.unassignLocationToTruck(id, filteredIds);
              }
              await prisma.location.deleteMany({
                where: {
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  deliveryRouteCalculationDateId:
                    locationData.deliveryRouteCalculationDateId,
                },
              });
              if (numberOfSplite === 1) {
                await prisma.location.create({
                  data: { ...locationData, capacity: totalCapacity },
                });
              } else if (numberOfSplite > 1) {
                let remainingCapacity = totalCapacity;

                for (let i = 0; i < numberOfSplite; i++) {
                  // Determine the capacity for the current split
                  const currentCapacity = Math.min(
                    remainingCapacity,
                    truckSize.containerCubic,
                  );

                  // Reduce the remaining capacity by the current split's capacity
                  remainingCapacity -= currentCapacity;

                  await prisma.location.create({
                    data: { ...locationData, capacity: currentCapacity },
                  });
                }
              }
            }
          } else {
            if (numberOfSplite === 1) {
              await prisma.location.create({
                data: { ...locationData, capacity: totalCapacity },
              });
            } else if (numberOfSplite > 1) {
              let remainingCapacity = totalCapacity;

              for (let i = 0; i < numberOfSplite; i++) {
                // Determine the capacity for the current split
                const currentCapacity = Math.min(
                  remainingCapacity,
                  truckSize.containerCubic,
                );

                // Reduce the remaining capacity by the current split's capacity
                remainingCapacity -= currentCapacity;

                await prisma.location.create({
                  data: { ...locationData, capacity: currentCapacity },
                });
              }
            }
          }
        }
      });
      return 'Created successfully';
    } catch (error) {
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

    const response = await this.prisma.truckByDate.findMany({
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
        AssignLocationToTruck: {
          include: {
            location: {
              select: {
                partOfDay: true,
                capacity: true,
              },
            },
          },
        },
      },
    });
    const transformedResponse = response.map((truck) => {
      const AssignLocationToTruck = truck.AssignLocationToTruck.reduce(
        (acc, item) => {
          const { partOfDay, capacity } = item.location;
          if (!acc[partOfDay]) {
            acc[partOfDay] = { number_of_delivery: 0, total_capacity: 0 };
          }
          acc[partOfDay].number_of_delivery += 1;
          acc[partOfDay].total_capacity += capacity;
          return acc;
        },
        {},
      );

      return {
        ...truck,
        partOfDays: AssignLocationToTruck,
      };
    });

    return transformedResponse;
  }

  // async findAllLocations(params: {
  //   deliveryRouteCalculationDateId: number;
  //   zoneId?: number;
  //   truckSizeId?: number;
  //   partOfDay?: PartOfDay;
  //   priority?: Priority;
  //   capacity?: number;
  //   query?: string;
  //   isAssign?: string;
  //   truckByDateId?: string;
  // }): Promise<Location[]> {
  //   const {
  //     deliveryRouteCalculationDateId,
  //     zoneId,
  //     truckSizeId,
  //     partOfDay,
  //     priority,
  //     capacity,
  //     query,
  //     isAssign,
  //     truckByDateId,
  //   } = params;

  //   if (!deliveryRouteCalculationDateId) {
  //     throw new BadRequestException();
  //   }

  //   if (truckByDateId) {
  //     const locations = await this.prisma.location.findMany({
  //       where: {
  //         AssignLocationToTruck: {
  //           some: {
  //             truckByDateId: +truckByDateId,
  //           },
  //         },
  //       },
  //       include: {
  //         zone: true,
  //         truckSize: true,
  //       },
  //     });

  //     // Set isAssign to true for all locations in the response
  //     const updatedLocations = locations.map((location) => ({
  //       ...location,
  //       isAssign: true,
  //     }));

  //     return updatedLocations;
  //   } else {
  //     // Fetch locations
  //     const response = await this.prisma.location.findMany({
  //       where: {
  //         deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
  //         ...(zoneId && { zoneId: +zoneId }),
  //         ...(truckSizeId && { truckSizeId: +truckSizeId }),
  //         ...(partOfDay && { partOfDay }),
  //         ...(priority && { priority }),
  //         ...(capacity && { capacity: { lte: +capacity } }),
  //         OR: query
  //           ? [
  //               {
  //                 phone: {
  //                   contains: query,
  //                   mode: 'insensitive',
  //                 },
  //               },
  //               {
  //                 se: {
  //                   contains: query,
  //                   mode: 'insensitive',
  //                 },
  //               },
  //             ]
  //           : undefined,
  //       },
  //       include: {
  //         zone: true,
  //         truckSize: true,
  //       },
  //     });

  //     // Fetch assigned locations
  //     const AssignLocationToTruckData =
  //       await this.prisma.assignLocationToTruck.findMany({
  //         where: {
  //           deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
  //         },
  //       });

  //     // Set isAssign dynamically based on the fetched data
  //     const assignedLocationIds = new Set(
  //       AssignLocationToTruckData.map((item) => item.locationId),
  //     );

  //     const updatedResponse = response.map((location) => {
  //       return {
  //         ...location,
  //         isAssign: assignedLocationIds.has(location.id),
  //       };
  //     });

  //     // Filter response based on isAssign if the parameter was provided
  //     if (isAssign !== undefined) {
  //       const isAssignValue = isAssign === 'true';
  //       return updatedResponse.filter(
  //         (location) => location.isAssign === isAssignValue,
  //       );
  //     }

  //     return updatedResponse;
  //   }
  // }
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

    const priorityOrder = {
      CRITICAL: 1,
      HIGH: 2,
      MEDIUM: 3,
      LOW: 4,
      TRIVIAL: 5,
    };

    const partOfDayOrder = {
      MORNING: 1,
      AFTERNOON: 2,
      EVENING: 3,
      NIGHT: 4,
    };

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

      const updatedLocations = locations.map((location) => ({
        ...location,
        isAssign: true,
      }));

      // Sort the locations based on partOfDay and priority
      updatedLocations.sort((a, b) => {
        const partOfDayComparison =
          partOfDayOrder[a.partOfDay] - partOfDayOrder[b.partOfDay];
        if (partOfDayComparison !== 0) return partOfDayComparison;

        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      return updatedLocations;
    } else {
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

      const AssignLocationToTruckData =
        await this.prisma.assignLocationToTruck.findMany({
          where: {
            deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
          },
        });

      const assignedLocationIds = new Set(
        AssignLocationToTruckData.map((item) => item.locationId),
      );

      const updatedResponse = response.map((location) => {
        return {
          ...location,
          isAssign: assignedLocationIds.has(location.id),
        };
      });

      // Sort the locations based on partOfDay and priority
      updatedResponse.sort((a, b) => {
        const partOfDayComparison =
          partOfDayOrder[a.partOfDay] - partOfDayOrder[b.partOfDay];
        if (partOfDayComparison !== 0) return partOfDayComparison;

        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

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
