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
import * as ExcelJS from 'exceljs';
import {
  Flag,
  Location,
  PartOfDay,
  Priority,
  PrismaClient,
  TruckSize,
  TruckStatus,
} from '@prisma/client';
import { CreateTruckByDateDto } from './dto/create-truck-by-date.dto';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UnassignDto } from './dto/unassign-drc.dto';
import { DeleteLocationDrcDto } from './dto/delete-location-drc.dto';
import { UpdatePartOfDayDto } from './dto/update-part-of-day.dto';

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
      const jsonData: CreateSubDrcDto[] = this.convertExcelToJson(result.path);

      let index = 0;
      // Validate each DRC object
      for (const drc of jsonData) {
        const drcDto = plainToClass(CreateSubDrcDto, drc);
        const errors = await validate(drcDto);

        if (errors.length > 0) {
          throw new HttpException(
            {
              message: `Please check your input data in excel at line ${index + 2}`,
              errors: errors
                .map((err) => Object.values(err.constraints))
                .flat(),
            },
            HttpStatus.BAD_REQUEST,
          );
        }
        index++;
      }
      // start create
      await this.prisma.$transaction(async (prisma: PrismaClient) => {
        await this.handleNewLocations(jsonData, id, prisma);
        await this.processFlagInf(jsonData, id, prisma);
        await this.processFlagCap(jsonData, id, prisma);
        await this.processFlagDel(jsonData, id, prisma);
      });
    } catch (error) {
      throw error;
    }
  }
  private async handleNewLocations(
    jsonData: CreateSubDrcDto[],
    id: number,
    prisma: PrismaClient,
  ) {
    // Filter out locations that are either new or don't have a code
    const filteredData = jsonData.filter(
      (item) => item.code === '' || item.code === undefined,
    );

    // Loop through each direction/location in the filtered data
    for (const direction of filteredData) {
      // Find the corresponding zone for the direction
      const zone = await prisma.zone.findFirst({
        where: { code: direction.zone },
      });
      if (!zone) {
        throw new NotFoundException('Zone not found');
      }

      // Fetch the default truck size (id = 2)
      let truckSize = await prisma.truckSize.findFirst({
        where: { default: true },
      });

      // If a truck size is provided, override the default truck size
      if (direction.truckSize) {
        const foundTruckSize = await prisma.truckSize.findFirst({
          where: { name: direction.truckSize },
        });
        if (!foundTruckSize) {
          throw new NotFoundException('Truck size not found');
        }
        truckSize = foundTruckSize;
      }

      // Fetch all available case sizes
      const caseSizes = await prisma.caseSize.findMany();
      if (!caseSizes || caseSizes.length === 0) {
        throw new NotFoundException('No case sizes found');
      }

      // Calculate the total capacity based on case sizes
      let totalCapacity = 0;
      const requirements = [];

      caseSizes.forEach((caseSize) => {
        const caseName = caseSize.name as keyof typeof direction;
        const caseQuantity = direction[caseName] as number;

        if (caseQuantity && caseSize.caseCubic) {
          totalCapacity += caseSize.caseCubic * caseQuantity;
          requirements.push({
            locationId: 0, // Placeholder, will be updated after creating the location
            caseSizeId: caseSize.id,
            amount: caseQuantity,
          });
        }
      });

      // Prepare location data for creation
      const locationData = {
        documentType: direction.documentType || '',
        documentNumber: direction.documentNumber || '',
        documentDate: direction.documentDate || '',
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
        deliveryDate: direction.deliveryDate || '',
        paymentTerm: direction.paymentTerm || '',
        comments: direction.comments || '',
        priority: direction.priority || 'LOW',
        partOfDay: direction.partOfDay || 'MORNING',
        capacity: totalCapacity,
        deliveryRouteCalculationDateId: id,
        flag: direction.flag || undefined,
        uploaddTime: direction.uploaddTime || '',
      };

      // Calculate the number of splits needed based on total capacity and truck size
      const numberOfSplits = Math.ceil(
        totalCapacity / truckSize.containerCubic,
      );

      // Handle case where no splitting is required
      if (numberOfSplits === 1) {
        const createdLocation = await prisma.location.create({
          data: locationData,
        });

        // Create requirements associated with the created location
        for (const req of requirements) {
          await prisma.requirement.create({
            data: {
              ...req,
              locationId: createdLocation.id,
            },
          });
        }

        // Auto-assign location to truck if a license plate is provided
        if (direction.licensePlate) {
          await this.autoAssignToTruck(
            prisma,
            direction.licensePlate,
            createdLocation.id,
            id,
          );
        }
      }
      // Handle case where splitting is required
      else if (numberOfSplits > 1) {
        let remainingCapacity = totalCapacity;
        const caseSizeIds = await prisma.caseSize.findMany({
          select: { id: true, caseCubic: true },
        });

        for (let i = 0; i < numberOfSplits; i++) {
          let currentCapacity = Math.min(
            remainingCapacity,
            truckSize.containerCubic,
          );
          remainingCapacity -= currentCapacity;

          const createdLocation = await prisma.location.create({
            data: {
              ...locationData,
              capacity: currentCapacity,
              isSplit: true,
            },
          });

          // Distribute case sizes across the split locations
          for (const req of requirements) {
            const caseSize = caseSizeIds.find((cs) => cs.id === req.caseSizeId);
            if (!caseSize) {
              throw new Error(`Case size with id ${req.caseSizeId} not found`);
            }

            // Determine split amount for the current location
            const maxAmountForCaseSize = Math.floor(
              currentCapacity / caseSize.caseCubic,
            );
            let splitAmount = Math.min(req.amount, maxAmountForCaseSize);

            currentCapacity -= splitAmount * caseSize.caseCubic;
            req.amount -= splitAmount;

            // Ensure remaining requirements are allocated in the last iteration
            if (i === numberOfSplits - 1 && req.amount > 0) {
              splitAmount += req.amount;
              req.amount = 0;
            }

            await prisma.requirement.create({
              data: {
                ...req,
                amount: splitAmount,
                locationId: createdLocation.id,
              },
            });
          }

          // Auto-assign only the first split to a truck
          if (i === 0 && direction.licensePlate) {
            await this.autoAssignToTruck(
              prisma,
              direction.licensePlate,
              createdLocation.id,
              id,
            );
          }
        }
      }
    }
  }

  /**
   * Auto-assign a location to a truck based on the license plate.
   * @param prisma - PrismaClient instance.
   * @param licensePlate - License plate of the truck.
   * @param locationId - ID of the location to assign.
   * @param deliveryRouteCalculationDateId - ID of the delivery route calculation date.
   */
  private async autoAssignToTruck(
    prisma: PrismaClient,
    licensePlate: string,
    locationId: number,
    deliveryRouteCalculationDateId: number,
  ) {
    const truck = await prisma.truck.findUnique({
      where: { licensePlate },
      select: { id: true },
    });

    if (!truck) {
      throw new NotFoundException(
        `Truck with license plate ${licensePlate} not found`,
      );
    }

    const truckByDate = await prisma.truckByDate.findFirst({
      where: {
        truckId: truck.id,
        deliveryRouteCalculationDateId,
      },
      select: { id: true },
    });

    if (!truckByDate) {
      throw new NotFoundException('Truck by date not found');
    }

    await prisma.assignLocationToTruck.create({
      data: {
        locationId,
        truckByDateId: truckByDate.id,
        deliveryRouteCalculationDateId,
      },
    });

    await prisma.location.update({
      where: { id: locationId },
      data: { isAssign: true },
    });
  }
  private async processFlagInf(
    jsonData: CreateSubDrcDto[],
    id: number,
    prisma: PrismaClient,
  ) {
    // Filter JSON data for entries with the INF flag
    const filteredFlagINF = jsonData.filter((item) => item.flag === Flag.INF);

    for (const direction of filteredFlagINF) {
      if (!direction.code) {
        throw new NotFoundException(
          `In locationName: ${direction.locationName} Cannot flag INF when Code is null`,
        );
      }
      // prevent update truck size
      const location = await this.prisma.location.findUnique({
        where: { code: direction.code },
        include: {
          truckSize: true,
        },
      });
      if (!location) {
        throw new BadRequestException();
      }
      if (location.truckSize.name !== direction.truckSize) {
        throw new BadRequestException('Cannot update truck Size');
      }
      // Find the zone based on the code in the direction data
      const zone = await prisma.zone.findFirst({
        where: { code: direction.zone },
      });
      if (!zone) {
        throw new NotFoundException(
          `Zone with code ${direction.zone} not found`,
        );
      }

      // Default truck size with ID 2
      let truckSize: TruckSize = await prisma.truckSize.findFirst({
        where: { default: true },
      });

      // Override truck size if provided in direction data
      if (direction.truckSize) {
        const foundTruckSize = await prisma.truckSize.findFirst({
          where: { name: direction.truckSize },
        });
        if (!foundTruckSize) {
          throw new NotFoundException(
            `Truck size ${direction.truckSize} not found`,
          );
        }
        truckSize = foundTruckSize;
      }

      // Fetch all case sizes
      const caseSizes = await prisma.caseSize.findMany();
      if (!caseSizes || caseSizes.length === 0) {
        throw new NotFoundException('No case sizes found');
      }

      // Prepare location data
      const locationData = {
        documentType: direction.documentType || '',
        documentNumber: direction.documentNumber || '',
        documentDate: direction.documentDate || '',
        sla: direction.sla || '',
        latitude: +direction.latitude,
        longitude: +direction.longitude,
        locationName: direction.locationName || '',
        phone: direction.phone || '',
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
        deliveryDate: direction.deliveryDate || '',
        paymentTerm: direction.paymentTerm || '',
        comments: direction.comments || '',
        priority: direction.priority || 'LOW',
        partOfDay: direction.partOfDay || 'MORNING',
        deliveryRouteCalculationDateId: id,
        uploaddTime: direction.uploaddTime || '',
      };

      // Fetch location info based on the code
      const locationInfo = await prisma.location.findFirst({
        where: { code: direction.code },
      });

      if (!locationInfo) {
        throw new NotFoundException(
          `Location with code ${direction.code} not found`,
        );
      }

      // Find matching locations based on latitude, longitude, part of the day, priority, and calculation date ID
      const matchingLocations = await prisma.location.findMany({
        where: {
          latitude: locationInfo.latitude,
          longitude: locationInfo.longitude,
          partOfDay: locationInfo.partOfDay,
          priority: locationInfo.priority,
          deliveryRouteCalculationDateId:
            locationInfo.deliveryRouteCalculationDateId,
        },
        select: {
          id: true,
        },
      });

      // Extract IDs from the matching locations
      const locationIds = matchingLocations.map((location) => location.id);

      // Update all matching locations with the new data
      await prisma.location.updateMany({
        where: { id: { in: locationIds } },
        data: locationData,
      });
    }
  }
  private async processFlagCap(
    jsonData: CreateSubDrcDto[],
    id: number,
    prisma: PrismaClient,
  ) {
    // Filter JSON data for entries with the CAP flag
    const filteredFlagCAP = jsonData.filter((item) => item.flag === Flag.CAP);

    for (const direction of filteredFlagCAP) {
      // check it contain code
      if (!direction.code) {
        throw new NotFoundException(
          `In locationName: ${direction.locationName} Cannot flag CAP when Code is null`,
        );
      }
      // Fetch the location to be deleted based on its code
      const locationDel = await prisma.location.findFirst({
        where: { code: direction.code },
      });
      if (!locationDel) {
        throw new NotFoundException(
          `Location with code ${direction.code} not found`,
        );
      }

      // Find all locations with matching coordinates, part of the day, priority, and delivery date
      const matchingLocations = await prisma.location.findMany({
        where: {
          latitude: locationDel.latitude,
          longitude: locationDel.longitude,
          partOfDay: locationDel.partOfDay,
          priority: locationDel.priority,
          deliveryRouteCalculationDateId:
            locationDel.deliveryRouteCalculationDateId,
        },
        select: { id: true },
      });

      // Delete all assigned locations from trucks
      for (const location of matchingLocations) {
        const assigned = await prisma.assignLocationToTruck.findFirst({
          where: {
            locationId: location.id,
            deliveryRouteCalculationDateId: id,
          },
        });

        if (assigned) {
          await prisma.assignLocationToTruck.deleteMany({
            where: {
              locationId: location.id,
              deliveryRouteCalculationDateId: id,
            },
          });
        }
      }

      // Delete all matching locations
      for (const location of matchingLocations) {
        await prisma.location.delete({
          where: { id: location.id },
        });
      }

      // Fetch the zone by code
      const zone = await prisma.zone.findFirst({
        where: { code: direction.zone },
      });
      if (!zone) {
        throw new NotFoundException(
          `Zone with code ${direction.zone} not found`,
        );
      }

      // Set default truck size, and override if specified in the direction data
      let truckSize = await prisma.truckSize.findFirst({
        where: { default: true },
      });

      if (direction.truckSize) {
        const specifiedTruckSize = await prisma.truckSize.findFirst({
          where: { name: direction.truckSize },
        });
        if (!specifiedTruckSize) {
          throw new NotFoundException(
            `Truck size ${direction.truckSize} not found`,
          );
        }
        truckSize = specifiedTruckSize;
      }

      // Fetch all case sizes
      const caseSizes = await prisma.caseSize.findMany();
      if (!caseSizes.length) {
        throw new NotFoundException('No case sizes found');
      }

      // Calculate total capacity and prepare requirements data
      let totalCapacity = 0;
      const requirements = caseSizes
        .map((caseSize) => {
          const caseName = caseSize.name as keyof typeof direction;
          const caseQuantity = direction[caseName] as number;

          if (caseQuantity && caseSize.caseCubic) {
            totalCapacity += caseSize.caseCubic * caseQuantity;
            return {
              locationId: 0, // Placeholder, will be updated after creating the location
              caseSizeId: caseSize.id,
              amount: caseQuantity,
            };
          }
        })
        .filter(Boolean); // Filter out undefined entries

      const locationData = {
        documentType: direction.documentType || '',
        documentNumber: direction.documentNumber || '',
        documentDate: direction.documentDate || '',
        sla: direction.sla || '',
        latitude: +direction.latitude,
        longitude: +direction.longitude,
        locationName: direction.locationName || '',
        phone: direction.phone || '',
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
        deliveryDate: direction.deliveryDate || '',
        paymentTerm: direction.paymentTerm || '',
        comments: direction.comments || '',
        priority: direction.priority || 'LOW',
        partOfDay: direction.partOfDay || 'MORNING',
        capacity: totalCapacity,
        deliveryRouteCalculationDateId: id,
        flag: direction.flag,
        uploaddTime: direction.uploaddTime || '',
      };

      const numberOfSplits = Math.ceil(
        totalCapacity / truckSize.containerCubic,
      );

      // Create new location(s) based on the calculated number of splits
      for (let i = 0; i < numberOfSplits; i++) {
        let currentCapacity = Math.min(totalCapacity, truckSize.containerCubic);
        totalCapacity -= currentCapacity;

        let createdLocation;
        if (numberOfSplits === 1) {
          createdLocation = await prisma.location.create({
            data: { ...locationData, capacity: currentCapacity },
          });
        } else {
          createdLocation = await prisma.location.create({
            data: { ...locationData, capacity: currentCapacity, isSplit: true },
          });
        }

        // Distribute the requirements across the split locations
        for (const req of requirements) {
          const caseSize = caseSizes.find((cs) => cs.id === req.caseSizeId);
          if (!caseSize) {
            throw new Error(`Case size with id ${req.caseSizeId} not found`);
          }

          const maxAmountForCaseSize = Math.floor(
            currentCapacity / caseSize.caseCubic,
          );
          let splitAmount = Math.min(req.amount, maxAmountForCaseSize);

          currentCapacity -= splitAmount * caseSize.caseCubic;
          req.amount -= splitAmount;

          if (i === numberOfSplits - 1 && req.amount > 0) {
            splitAmount += req.amount;
            req.amount = 0;
          }

          await prisma.requirement.create({
            data: {
              ...req,
              amount: splitAmount,
              locationId: createdLocation.id,
            },
          });
        }

        // Auto-assign the first split to a truck if a license plate is specified
        if (i === 0 && direction.licensePlate) {
          const truckId = await prisma.truck.findUnique({
            where: { licensePlate: direction.licensePlate },
            select: { id: true },
          });

          if (!truckId) {
            throw new NotFoundException(
              `Truck with license plate ${direction.licensePlate} not found`,
            );
          }

          const truckByDate = await prisma.truckByDate.findFirst({
            where: {
              truckId: truckId.id,
              deliveryRouteCalculationDateId: id,
            },
            select: { id: true },
          });

          if (!truckByDate) {
            throw new NotFoundException(
              `Truck by date not found for truck ID ${truckId.id}`,
            );
          }

          await prisma.assignLocationToTruck.create({
            data: {
              locationId: createdLocation.id,
              truckByDateId: truckByDate.id,
              deliveryRouteCalculationDateId: id,
            },
          });

          await prisma.location.update({
            where: { id: createdLocation.id },
            data: { isAssign: true },
          });
        }
      }
    }
  }
  private async processFlagDel(
    jsonData: CreateSubDrcDto[],
    id: number,
    prisma: PrismaClient,
  ) {
    // Filter JSON data for entries with the CAP flag
    const filteredFlagDEL = jsonData.filter((item) => item.flag === Flag.DEL);

    for (const direction of filteredFlagDEL) {
      if (!direction.code) {
        throw new NotFoundException(
          `In locationName: ${direction.locationName} Cannot flag DEL when Code is null`,
        );
      }
      // Fetch the location to be deleted based on its code
      const locationDel = await prisma.location.findFirst({
        where: { code: direction.code },
      });
      if (!locationDel) {
        throw new NotFoundException(
          `Location with code ${direction.code} not found`,
        );
      }

      // Find all locations with matching coordinates, part of the day, priority, and delivery date
      const matchingLocations = await prisma.location.findMany({
        where: {
          latitude: locationDel.latitude,
          longitude: locationDel.longitude,
          partOfDay: locationDel.partOfDay,
          priority: locationDel.priority,
          deliveryRouteCalculationDateId:
            locationDel.deliveryRouteCalculationDateId,
        },
        select: { id: true },
      });

      // Delete all assigned locations from trucks
      for (const location of matchingLocations) {
        const assigned = await prisma.assignLocationToTruck.findFirst({
          where: {
            locationId: location.id,
            deliveryRouteCalculationDateId: id,
          },
        });

        if (assigned) {
          await prisma.assignLocationToTruck.deleteMany({
            where: {
              locationId: location.id,
              deliveryRouteCalculationDateId: id,
            },
          });
        }
      }

      // Delete all matching locations
      for (const location of matchingLocations) {
        await prisma.location.delete({
          where: { id: location.id },
        });
      }
    }
  }
  async createNewLocation(id: number, data: any) {
    try {
      // change zoneId to zoneCode
      const zoneId = data.zoneId;
      const truckSizeId = data.truckSizeId;
      if (!zoneId || !truckSizeId) {
        throw new NotFoundException();
      }
      const zone = await this.prisma.zone.findUnique({
        where: { id: +zoneId },
        select: { code: true },
      });
      const truckSize = await this.prisma.truckSize.findUnique({
        where: { id: +truckSizeId },
        select: { name: true },
      });
      const newData = [{ ...data, zone: zone.code, truckSize: truckSize.name }];
      await this.prisma.$transaction(async (prisma: PrismaClient) => {
        await this.handleNewLocations(newData, id, prisma);
      });
      return 'create succesfully';
    } catch (error) {
      throw error;
    }
  }
  async updateSingleLocationInf(id: number, data: any) {
    try {
      // prevent update truck size
      const locationInfo = await this.prisma.location.findUnique({
        where: { code: data.code },
      });
      if (!locationInfo) {
        throw new BadRequestException();
      }
      if (locationInfo.truckSizeId !== data.truckSizeId) {
        throw new BadRequestException('Cannot update truck Size');
      }
      // start update
      const zoneId = data.zoneId;
      const truckSizeId = data.truckSizeId;
      if (!zoneId || !truckSizeId) {
        throw new NotFoundException();
      }
      const zone = await this.prisma.zone.findUnique({
        where: { id: +zoneId },
        select: { code: true },
      });
      const truckSize = await this.prisma.truckSize.findUnique({
        where: { id: +truckSizeId },
        select: { name: true },
      });
      const newData = [
        { ...data, zone: zone.code, truckSize: truckSize.name, flag: Flag.INF },
      ];
      await this.prisma.$transaction(async (prisma: PrismaClient) => {
        await this.processFlagInf(newData, id, prisma);
      });
      return 'updated succesfully';
    } catch (error) {
      throw error;
    }
  }
  async updateCapNewLocation(id: number, data: any) {
    try {
      // find location id by code
      const locationId = await this.prisma.location.findUnique({
        where: { code: data.code },
        select: { id: true },
      });
      // get assign tuck
      const assigned = await this.prisma.assignLocationToTruck.findFirst({
        where: {
          locationId: locationId.id,
          deliveryRouteCalculationDateId: id,
        },
        include: {
          truckByDate: {
            include: {
              truck: {
                select: {
                  licensePlate: true,
                },
              },
            },
          },
        },
      });
      // change zoneId to zoneCode
      const zoneId = data.zoneId;
      const truckSizeId = data.truckSizeId;
      if (!zoneId || !truckSizeId) {
        throw new NotFoundException();
      }
      const zone = await this.prisma.zone.findUnique({
        where: { id: +zoneId },
        select: { code: true },
      });
      const truckSize = await this.prisma.truckSize.findUnique({
        where: { id: +truckSizeId },
        select: { name: true },
      });
      let newData = [
        { ...data, zone: zone.code, truckSize: truckSize.name, flag: Flag.CAP },
      ];
      if (assigned?.truckByDate?.truck?.licensePlate) {
        newData = [
          {
            ...data,
            zone: zone.code,
            truckSize: truckSize.name,
            flag: Flag.CAP,
            licensePlate: assigned.truckByDate.truck.licensePlate,
          },
        ];
      }
      await this.prisma.$transaction(async (prisma: PrismaClient) => {
        await this.processFlagCap(newData, id, prisma);
      });
      return 'update succesfully';
    } catch (error) {
      throw error;
    }
  }

  // private async handleNewLocations(
  //   jsonData: CreateSubDrcDto[],
  //   id: number,
  //   prisma: PrismaClient,
  // ) {
  //   const filteredData = jsonData.filter(
  //     (item) => item.code === '' || item.code === undefined,
  //   );
  //   for (const direction of filteredData) {
  //     const zone = await prisma.zone.findFirst({
  //       where: { code: direction.zone },
  //     });
  //     if (!zone) {
  //       throw new NotFoundException();
  //     }

  //     let truckSize: TruckSize = await prisma.truckSize.findUnique({
  //       where: { id: 2 },
  //     });

  //     if (direction.truckSize) {
  //       const IsTruckSize = await prisma.truckSize.findFirst({
  //         where: { name: direction.truckSize },
  //       });
  //       if (!IsTruckSize) {
  //         throw new NotFoundException();
  //       }
  //       truckSize = IsTruckSize;
  //     }

  //     // Fetch all case sizes dynamically
  //     const caseSizes = await prisma.caseSize.findMany();

  //     if (!caseSizes || caseSizes.length === 0) {
  //       throw new NotFoundException('No case sizes found');
  //     }

  //     // Calculate total capacity dynamically
  //     let totalCapacity = 0;
  //     const requirements = [];

  //     caseSizes.forEach((caseSize) => {
  //       const caseName = caseSize.name as keyof typeof direction;
  //       const caseQuantity = direction[caseName] as number;

  //       if (caseQuantity && caseSize.caseCubic) {
  //         totalCapacity += caseSize.caseCubic * caseQuantity;
  //         requirements.push({
  //           locationId: 0, // Placeholder, will be updated after creating the location
  //           caseSizeId: caseSize.id,
  //           amount: caseQuantity,
  //         });
  //       }
  //     });

  //     const locationData = {
  //       documentType: direction.documentType || '',
  //       documentNumber: direction.documentNumber || '',
  //       sla: direction.sla || '',
  //       latitude: +direction.latitude,
  //       longitude: +direction.longitude,
  //       locationName: direction.locationName || '',
  //       phone: direction.phone + '' || '',
  //       se: direction.se || '',
  //       homeNo: direction.homeNo || '',
  //       streetNo: direction.streetNo || '',
  //       village: direction.village || '',
  //       sangkat: direction.sangkat || '',
  //       khan: direction.khan || '',
  //       hotSpot: direction.hotSpot || '',
  //       direction: direction.direction || '',
  //       area: direction.area || '',
  //       region: direction.region || '',
  //       division: direction.division || '',
  //       zoneId: zone.id,
  //       truckSizeId: truckSize?.id || null,
  //       deliveryDate: new Date(direction.deliveryDate),
  //       paymentTerm: direction.paymentTerm || '',
  //       comments: direction.comments || '',
  //       priority: direction.priority || 'LOW',
  //       partOfDay: direction.partOfDay || 'MORNING',
  //       capacity: totalCapacity,
  //       deliveryRouteCalculationDateId: id,
  //       flag: direction.flag || undefined,
  //     };

  //     const numberOfSplite = Math.ceil(
  //       totalCapacity / truckSize.containerCubic,
  //     );

  //     // create new
  //     if (numberOfSplite === 1) {
  //       const createdLocation = await prisma.location.create({
  //         data: locationData,
  //       });

  //       // Update Requirements with the created locationId
  //       for (const req of requirements) {
  //         await prisma.requirement.create({
  //           data: {
  //             ...req,
  //             locationId: createdLocation.id,
  //           },
  //         });
  //       }
  //       // auto assign if contain plate
  //       // find truck id
  //       if (direction.licensePlate) {
  //         const truckId = await prisma.truck.findUnique({
  //           where: { licensePlate: direction.licensePlate },
  //           select: { id: true },
  //         });

  //         if (!truckId) {
  //           throw new NotFoundException(
  //             `Truck licensePate ${direction.licensePlate} not found`,
  //           );
  //         }
  //         // find truck by date id
  //         const truckByDate = await prisma.truckByDate.findFirst({
  //           where: {
  //             truckId: truckId.id,
  //             deliveryRouteCalculationDateId: id,
  //           },
  //           select: {
  //             id: true,
  //           },
  //         });
  //         if (!truckByDate) {
  //           throw new NotFoundException();
  //         }
  //         await prisma.assignLocationToTruck.create({
  //           data: {
  //             locationId: createdLocation.id,
  //             truckByDateId: truckByDate.id,
  //             deliveryRouteCalculationDateId: id,
  //           },
  //         });
  //         await prisma.location.update({
  //           where: { id: createdLocation.id },
  //           data: { isAssign: true },
  //         });
  //       }
  //     } else if (numberOfSplite > 1) {
  //       let remainingCapacity = totalCapacity;
  //       const caseSizeIds = await prisma.caseSize.findMany({
  //         select: { id: true, caseCubic: true },
  //       });

  //       for (let i = 0; i < numberOfSplite; i++) {
  //         let currentCapacity = Math.min(
  //           remainingCapacity,
  //           truckSize.containerCubic,
  //         );

  //         remainingCapacity -= currentCapacity;

  //         const createdLocation = await prisma.location.create({
  //           data: {
  //             ...locationData,
  //             capacity: currentCapacity,
  //           },
  //         });

  //         // Calculate the split amount for each requirement based on the current capacity
  //         for (const req of requirements) {
  //           const caseSize = caseSizeIds.find((cs) => cs.id === req.caseSizeId);

  //           if (!caseSize) {
  //             throw new Error(`Case size with id ${req.caseSizeId} not found`);
  //           }

  //           // Calculate the maximum amount of this case size that can fit into the current capacity
  //           const maxAmountForCaseSize = Math.floor(
  //             currentCapacity / caseSize.caseCubic,
  //           );

  //           // Determine how much of the requirement amount can be assigned to this location
  //           let splitAmount = Math.min(req.amount, maxAmountForCaseSize);

  //           // Adjust currentCapacity and the requirement amount
  //           currentCapacity -= splitAmount * caseSize.caseCubic;
  //           req.amount -= splitAmount;

  //           // Ensure that any remaining requirement amount is allocated
  //           if (i === numberOfSplite - 1 && req.amount > 0) {
  //             splitAmount += req.amount;
  //             req.amount = 0;
  //           }

  //           await prisma.requirement.create({
  //             data: {
  //               ...req,
  //               amount: splitAmount,
  //               locationId: createdLocation.id,
  //             },
  //           });
  //         }
  //         // auto assign when i = 0
  //         if (i === 0) {
  //           if (direction.licensePlate) {
  //             const truckId = await prisma.truck.findUnique({
  //               where: { licensePlate: direction.licensePlate },
  //               select: { id: true },
  //             });

  //             if (!truckId) {
  //               throw new NotFoundException(
  //                 `Truck licensePate ${direction.licensePlate} not found`,
  //               );
  //             }
  //             // find truck by date id
  //             const truckByDate = await prisma.truckByDate.findFirst({
  //               where: {
  //                 truckId: truckId.id,
  //                 deliveryRouteCalculationDateId: id,
  //               },
  //               select: {
  //                 id: true,
  //               },
  //             });
  //             if (!truckByDate) {
  //               throw new NotFoundException();
  //             }
  //             await prisma.assignLocationToTruck.create({
  //               data: {
  //                 locationId: createdLocation.id,
  //                 truckByDateId: truckByDate.id,
  //                 deliveryRouteCalculationDateId: id,
  //               },
  //             });
  //             await prisma.location.update({
  //               where: { id: createdLocation.id },
  //               data: { isAssign: true },
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
  // private async processFlagInf(
  //   jsonData: CreateSubDrcDto[],
  //   id: number,
  //   prisma: PrismaClient,
  // ) {
  //   const filteredFlagINF = jsonData.filter((item) => item.flag === Flag.INF);
  //   for (const direction of filteredFlagINF) {
  //     const zone = await prisma.zone.findFirst({
  //       where: { code: direction.zone },
  //     });
  //     if (!zone) {
  //       throw new NotFoundException();
  //     }

  //     let truckSize: TruckSize = await prisma.truckSize.findUnique({
  //       where: { id: 2 },
  //     });

  //     if (direction.truckSize) {
  //       const IsTruckSize = await prisma.truckSize.findFirst({
  //         where: { name: direction.truckSize },
  //       });
  //       if (!IsTruckSize) {
  //         throw new NotFoundException();
  //       }
  //       truckSize = IsTruckSize;
  //     }

  //     // Fetch all case sizes dynamically
  //     const caseSizes = await prisma.caseSize.findMany();

  //     if (!caseSizes || caseSizes.length === 0) {
  //       throw new NotFoundException('No case sizes found');
  //     }

  //     const locationData = {
  //       documentType: direction.documentType || '',
  //       documentNumber: direction.documentNumber || '',
  //       sla: direction.sla || '',
  //       latitude: +direction.latitude,
  //       longitude: +direction.longitude,
  //       locationName: direction.locationName || '',
  //       phone: direction.phone + '' || '',
  //       se: direction.se || '',
  //       homeNo: direction.homeNo || '',
  //       streetNo: direction.streetNo || '',
  //       village: direction.village || '',
  //       sangkat: direction.sangkat || '',
  //       khan: direction.khan || '',
  //       hotSpot: direction.hotSpot || '',
  //       direction: direction.direction || '',
  //       area: direction.area || '',
  //       region: direction.region || '',
  //       division: direction.division || '',
  //       zoneId: zone.id,
  //       truckSizeId: truckSize?.id || null,
  //       deliveryDate: new Date(direction.deliveryDate),
  //       paymentTerm: direction.paymentTerm || '',
  //       comments: direction.comments || '',
  //       priority: direction.priority || 'LOW',
  //       partOfDay: direction.partOfDay || 'MORNING',
  //       deliveryRouteCalculationDateId: id,
  //     };

  //     // get information by code
  //     const locationInfo = await prisma.location.findFirst({
  //       where: { code: direction.code },
  //     });

  //     // Get code of flag INF
  //     const matchingLocations = await prisma.location.findMany({
  //       where: {
  //         latitude: locationInfo.latitude,
  //         longitude: locationInfo.longitude,
  //         partOfDay: locationInfo.partOfDay,
  //         priority: locationInfo.priority,
  //         deliveryRouteCalculationDateId:
  //           locationInfo.deliveryRouteCalculationDateId,
  //       },
  //       select: {
  //         id: true,
  //       },
  //     });

  //     // Extract IDs from the matching locations
  //     const locationIds = matchingLocations.map((location) => location.id);

  //     // Start update of every location information
  //     await prisma.location.updateMany({
  //       where: {
  //         id: {
  //           in: locationIds,
  //         },
  //       },
  //       data: {
  //         ...locationData, // Spread locationData to include all fields directly
  //       },
  //     });
  //   }
  // }
  // private async processFlagCap(
  //   jsonData: CreateSubDrcDto[],
  //   id: number,
  //   prisma: PrismaClient,
  // ) {
  //   const filteredFlagCAP = jsonData.filter((item) => item.flag === Flag.CAP);
  //   for (const direction of filteredFlagCAP) {
  //     // delete all locations
  //     // get information by code
  //     const locationDel = await prisma.location.findFirst({
  //       where: { code: direction.code },
  //     });

  //     // Get code of flag INF
  //     const matchingLocations = await prisma.location.findMany({
  //       where: {
  //         latitude: locationDel.latitude,
  //         longitude: locationDel.longitude,
  //         partOfDay: locationDel.partOfDay,
  //         priority: locationDel.priority,
  //         deliveryRouteCalculationDateId:
  //           locationDel.deliveryRouteCalculationDateId,
  //       },
  //       select: {
  //         id: true,
  //       },
  //     });

  //     // Extract IDs from the matching locations
  //     // const locationIds = matchingLocations.map((location) => location.id);
  //     // start delete location
  //     for (const isAssigned of matchingLocations) {
  //       const assigned = await prisma.assignLocationToTruck.findFirst({
  //         where: {
  //           locationId: isAssigned.id,
  //           deliveryRouteCalculationDateId: id,
  //         },
  //       });
  //       if (assigned) {
  //         await prisma.assignLocationToTruck.deleteMany({
  //           where: {
  //             locationId: isAssigned.id,
  //             deliveryRouteCalculationDateId: id,
  //           },
  //         });
  //       }
  //     }
  //     // Start delete
  //     for (const location of matchingLocations) {
  //       await prisma.location.delete({
  //         where: {
  //           id: location.id,
  //         },
  //       });
  //     }
  //     // end

  //     const zone = await prisma.zone.findFirst({
  //       where: { code: direction.zone },
  //     });
  //     if (!zone) {
  //       throw new NotFoundException();
  //     }

  //     let truckSize: TruckSize = await prisma.truckSize.findUnique({
  //       where: { id: 2 },
  //     });

  //     if (direction.truckSize) {
  //       const IsTruckSize = await prisma.truckSize.findFirst({
  //         where: { name: direction.truckSize },
  //       });
  //       if (!IsTruckSize) {
  //         throw new NotFoundException();
  //       }
  //       truckSize = IsTruckSize;
  //     }

  //     // Fetch all case sizes dynamically
  //     const caseSizes = await prisma.caseSize.findMany();

  //     if (!caseSizes || caseSizes.length === 0) {
  //       throw new NotFoundException('No case sizes found');
  //     }

  //     // Calculate total capacity dynamically
  //     let totalCapacity = 0;
  //     const requirements = [];

  //     caseSizes.forEach((caseSize) => {
  //       const caseName = caseSize.name as keyof typeof direction;
  //       const caseQuantity = direction[caseName] as number;

  //       if (caseQuantity && caseSize.caseCubic) {
  //         totalCapacity += caseSize.caseCubic * caseQuantity;
  //         requirements.push({
  //           locationId: 0, // Placeholder, will be updated after creating the location
  //           caseSizeId: caseSize.id,
  //           amount: caseQuantity,
  //         });
  //       }
  //     });

  //     const locationData = {
  //       documentType: direction.documentType || '',
  //       documentNumber: direction.documentNumber || '',
  //       sla: direction.sla || '',
  //       latitude: +direction.latitude,
  //       longitude: +direction.longitude,
  //       locationName: direction.locationName || '',
  //       phone: direction.phone + '' || '',
  //       se: direction.se || '',
  //       homeNo: direction.homeNo || '',
  //       streetNo: direction.streetNo || '',
  //       village: direction.village || '',
  //       sangkat: direction.sangkat || '',
  //       khan: direction.khan || '',
  //       hotSpot: direction.hotSpot || '',
  //       direction: direction.direction || '',
  //       area: direction.area || '',
  //       region: direction.region || '',
  //       division: direction.division || '',
  //       zoneId: zone.id,
  //       truckSizeId: truckSize?.id || null,
  //       deliveryDate: new Date(direction.deliveryDate),
  //       paymentTerm: direction.paymentTerm || '',
  //       comments: direction.comments || '',
  //       priority: direction.priority || 'LOW',
  //       partOfDay: direction.partOfDay || 'MORNING',
  //       capacity: totalCapacity,
  //       deliveryRouteCalculationDateId: id,
  //       flag: direction.flag || undefined,
  //     };

  //     const numberOfSplite = Math.ceil(
  //       totalCapacity / truckSize.containerCubic,
  //     );

  //     // create new
  //     if (numberOfSplite === 1) {
  //       const createdLocation = await prisma.location.create({
  //         data: locationData,
  //       });

  //       // Update Requirements with the created locationId
  //       for (const req of requirements) {
  //         await prisma.requirement.create({
  //           data: {
  //             ...req,
  //             locationId: createdLocation.id,
  //           },
  //         });
  //       }
  //       // auto assign if contain plate
  //       // find truck id
  //       if (direction.licensePlate) {
  //         const truckId = await prisma.truck.findUnique({
  //           where: { licensePlate: direction.licensePlate },
  //           select: { id: true },
  //         });

  //         if (!truckId) {
  //           throw new NotFoundException(
  //             `Truck licensePate ${direction.licensePlate} not found`,
  //           );
  //         }
  //         // find truck by date id
  //         const truckByDate = await prisma.truckByDate.findFirst({
  //           where: {
  //             truckId: truckId.id,
  //             deliveryRouteCalculationDateId: id,
  //           },
  //           select: {
  //             id: true,
  //           },
  //         });
  //         if (!truckByDate) {
  //           throw new NotFoundException();
  //         }
  //         await prisma.assignLocationToTruck.create({
  //           data: {
  //             locationId: createdLocation.id,
  //             truckByDateId: truckByDate.id,
  //             deliveryRouteCalculationDateId: id,
  //           },
  //         });
  //         await prisma.location.update({
  //           where: { id: createdLocation.id },
  //           data: { isAssign: true },
  //         });
  //       }
  //     } else if (numberOfSplite > 1) {
  //       let remainingCapacity = totalCapacity;
  //       const caseSizeIds = await prisma.caseSize.findMany({
  //         select: { id: true, caseCubic: true },
  //       });

  //       for (let i = 0; i < numberOfSplite; i++) {
  //         let currentCapacity = Math.min(
  //           remainingCapacity,
  //           truckSize.containerCubic,
  //         );

  //         remainingCapacity -= currentCapacity;

  //         const createdLocation = await prisma.location.create({
  //           data: {
  //             ...locationData,
  //             capacity: currentCapacity,
  //           },
  //         });

  //         // Calculate the split amount for each requirement based on the current capacity
  //         for (const req of requirements) {
  //           const caseSize = caseSizeIds.find((cs) => cs.id === req.caseSizeId);

  //           if (!caseSize) {
  //             throw new Error(`Case size with id ${req.caseSizeId} not found`);
  //           }

  //           // Calculate the maximum amount of this case size that can fit into the current capacity
  //           const maxAmountForCaseSize = Math.floor(
  //             currentCapacity / caseSize.caseCubic,
  //           );

  //           // Determine how much of the requirement amount can be assigned to this location
  //           let splitAmount = Math.min(req.amount, maxAmountForCaseSize);

  //           // Adjust currentCapacity and the requirement amount
  //           currentCapacity -= splitAmount * caseSize.caseCubic;
  //           req.amount -= splitAmount;

  //           // Ensure that any remaining requirement amount is allocated
  //           if (i === numberOfSplite - 1 && req.amount > 0) {
  //             splitAmount += req.amount;
  //             req.amount = 0;
  //           }

  //           await prisma.requirement.create({
  //             data: {
  //               ...req,
  //               amount: splitAmount,
  //               locationId: createdLocation.id,
  //             },
  //           });
  //         }
  //         // auto assign when i = 0
  //         if (i === 0) {
  //           if (direction.licensePlate) {
  //             const truckId = await prisma.truck.findUnique({
  //               where: { licensePlate: direction.licensePlate },
  //               select: { id: true },
  //             });

  //             if (!truckId) {
  //               throw new NotFoundException(
  //                 `Truck licensePate ${direction.licensePlate} not found`,
  //               );
  //             }
  //             // find truck by date id
  //             const truckByDate = await prisma.truckByDate.findFirst({
  //               where: {
  //                 truckId: truckId.id,
  //                 deliveryRouteCalculationDateId: id,
  //               },
  //               select: {
  //                 id: true,
  //               },
  //             });
  //             if (!truckByDate) {
  //               throw new NotFoundException();
  //             }
  //             await prisma.assignLocationToTruck.create({
  //               data: {
  //                 locationId: createdLocation.id,
  //                 truckByDateId: truckByDate.id,
  //                 deliveryRouteCalculationDateId: id,
  //               },
  //             });
  //             await prisma.location.update({
  //               where: { id: createdLocation.id },
  //               data: { isAssign: true },
  //             });
  //           }
  //         }
  //       }
  //     }
  //   }
  // }
  // async createDrc(file: any, id: number) {
  //   try {
  //     const result = this.fileUploadService.handleFileUpload(file);
  //     const jsonData = this.convertExcelToJson(result.path);

  //     // Validate each DRC object
  //     for (const drc of jsonData) {
  //       const drcDto = plainToClass(CreateSubDrcDto, drc);
  //       const errors = await validate(drcDto);

  //       if (errors.length > 0) {
  //         throw new HttpException(
  //           {
  //             message: 'Validation failed',
  //             errors: errors
  //               .map((err) => Object.values(err.constraints))
  //               .flat(),
  //           },
  //           HttpStatus.BAD_REQUEST,
  //         );
  //       }
  //     }

  //     await this.prisma.$transaction(async (prisma) => {
  //       const oldLocations = await prisma.location.findMany({
  //         where: { deliveryRouteCalculationDateId: id },
  //       });

  //       // Check locations to delete
  //       const oldLocationsForCheck = await prisma.location.findMany({
  //         where: { deliveryRouteCalculationDateId: id },
  //         select: {
  //           id: true,
  //           latitude: true,
  //           longitude: true,
  //           deliveryRouteCalculationDateId: true,
  //         },
  //       });

  //       const filteredIds = oldLocationsForCheck
  //         .filter((oldLoc) => {
  //           const existsInJsonData = jsonData.some(
  //             (newLoc) =>
  //               newLoc.latitude === oldLoc.latitude &&
  //               newLoc.longitude === oldLoc.longitude,
  //           );
  //           return !existsInJsonData;
  //         })
  //         .map((oldLoc) => oldLoc.id);

  //       if (filteredIds.length > 0) {
  //         for (const location of filteredIds) {
  //           // Delete all related AssignLocationToTruck entries before deleting the location
  //           await prisma.assignLocationToTruck.deleteMany({
  //             where: {
  //               locationId: location,
  //               deliveryRouteCalculationDateId: id,
  //             },
  //           });

  //           // Now delete the location
  //           await prisma.location.delete({
  //             where: {
  //               id: location,
  //             },
  //           });
  //         }
  //       }

  //       for (const direction of jsonData) {
  //         const zone = await prisma.zone.findFirst({
  //           where: { code: direction.zone },
  //         });
  //         if (!zone) {
  //           throw new NotFoundException();
  //         }

  //         let truckSize: TruckSize = await prisma.truckSize.findUnique({
  //           where: { id: 2 },
  //         });

  //         if (direction.truckSize) {
  //           const IsTruckSize = await prisma.truckSize.findFirst({
  //             where: { name: direction.truckSize },
  //           });
  //           if (!IsTruckSize) {
  //             throw new NotFoundException();
  //           }
  //           truckSize = IsTruckSize;
  //         }

  //         // Fetch all case sizes dynamically
  //         const caseSizes = await prisma.caseSize.findMany();

  //         if (!caseSizes || caseSizes.length === 0) {
  //           throw new NotFoundException('No case sizes found');
  //         }

  //         // Calculate total capacity dynamically
  //         let totalCapacity = 0;
  //         const requirements = [];

  //         caseSizes.forEach((caseSize) => {
  //           const caseName = caseSize.name as keyof typeof direction;
  //           const caseQuantity = direction[caseName] as number;

  //           if (caseQuantity && caseSize.caseCubic) {
  //             totalCapacity += caseSize.caseCubic * caseQuantity;
  //             requirements.push({
  //               locationId: 0, // Placeholder, will be updated after creating the location
  //               caseSizeId: caseSize.id,
  //               amount: caseQuantity,
  //             });
  //           }
  //         });

  //         const locationData = {
  //           documentType: direction.documentType || '',
  //           documentNumber: direction.documentNumber || '',
  //           sla: direction.sla || '',
  //           latitude: +direction.latitude,
  //           longitude: +direction.longitude,
  //           locationName: direction.locationName || '',
  //           phone: direction.phone + '' || '',
  //           se: direction.se || '',
  //           homeNo: direction.homeNo || '',
  //           streetNo: direction.streetNo || '',
  //           village: direction.village || '',
  //           sangkat: direction.sangkat || '',
  //           khan: direction.khan || '',
  //           hotSpot: direction.hotSpot || '',
  //           direction: direction.direction || '',
  //           area: direction.area || '',
  //           region: direction.region || '',
  //           division: direction.division || '',
  //           zoneId: zone.id,
  //           truckSizeId: truckSize?.id || null,
  //           deliveryDate: new Date(direction.deliveryDate),
  //           paymentTerm: direction.paymentTerm || '',
  //           comments: direction.comments || '',
  //           priority: direction.priority || 'LOW',
  //           partOfDay: direction.partOfDay || 'MORNING',
  //           capacity: totalCapacity,
  //           deliveryRouteCalculationDateId: id,
  //           flag: direction.flag || '',
  //         };

  //         const numberOfSplite = Math.ceil(
  //           totalCapacity / truckSize.containerCubic,
  //         );

  //         const matchingLocation = oldLocations.find(
  //           (loc) =>
  //             loc.latitude === locationData.latitude &&
  //             loc.longitude === locationData.longitude &&
  //             loc.deliveryRouteCalculationDateId ===
  //               locationData.deliveryRouteCalculationDateId,
  //         );

  //         if (matchingLocation) {
  //           // matching location
  //           const { capacity, ...updateData } = locationData;
  //           const oldCapacity = await prisma.location.findMany({
  //             where: {
  //               latitude: locationData.latitude,
  //               longitude: locationData.longitude,
  //               deliveryRouteCalculationDateId:
  //                 locationData.deliveryRouteCalculationDateId,
  //             },
  //             select: {
  //               capacity: true,
  //               id: true,
  //             },
  //           });

  //           // Sum the capacities
  //           const totalOldCapacity = oldCapacity.reduce(
  //             (total, { capacity }) => total + capacity,
  //             0,
  //           );

  //           const ids = oldCapacity.map(({ id }) => id);
  //           const epsilon = 1e-10;
  //           const areEqual = Math.abs(totalOldCapacity - capacity) < epsilon;

  //           if (areEqual) {
  //             // matching location with capacity equal
  //             await prisma.location.updateMany({
  //               where: {
  //                 latitude: locationData.latitude,
  //                 longitude: locationData.longitude,
  //                 deliveryRouteCalculationDateId:
  //                   locationData.deliveryRouteCalculationDateId,
  //               },
  //               data: updateData,
  //             });
  //           } else {
  //             // not equal capacity unassigned
  //             const getAssignedIds =
  //               await prisma.assignLocationToTruck.findMany({
  //                 where: { deliveryRouteCalculationDateId: id },
  //                 select: { locationId: true },
  //               });

  //             const assignedIds = getAssignedIds.map(
  //               ({ locationId }) => locationId,
  //             );
  //             const filteredIds: UnassignDto = {
  //               locationIds: ids.filter((id) => assignedIds.includes(id)),
  //             };

  //             if (assignedIds.length > 0) {
  //               await this.unassignLocationToTruck(id, filteredIds);
  //             }

  //             await prisma.location.deleteMany({
  //               where: {
  //                 latitude: locationData.latitude,
  //                 longitude: locationData.longitude,
  //                 deliveryRouteCalculationDateId:
  //                   locationData.deliveryRouteCalculationDateId,
  //               },
  //             });

  //             // start create again
  //             if (numberOfSplite === 1) {
  //               const createdLocation = await prisma.location.create({
  //                 data: locationData,
  //               });

  //               // Update Requirements with the created locationId
  //               for (const req of requirements) {
  //                 await prisma.requirement.create({
  //                   data: {
  //                     ...req,
  //                     locationId: createdLocation.id,
  //                   },
  //                 });
  //               }
  //             } else if (numberOfSplite > 1) {
  //               let remainingCapacity = totalCapacity;
  //               const caseSizeIds = await prisma.caseSize.findMany({
  //                 select: { id: true, caseCubic: true },
  //               });

  //               for (let i = 0; i < numberOfSplite; i++) {
  //                 let currentCapacity = Math.min(
  //                   remainingCapacity,
  //                   truckSize.containerCubic,
  //                 );

  //                 remainingCapacity -= currentCapacity;

  //                 const createdLocation = await prisma.location.create({
  //                   data: {
  //                     ...locationData,
  //                     capacity: currentCapacity,
  //                   },
  //                 });

  //                 // Calculate the split amount for each requirement based on the current capacity
  //                 for (const req of requirements) {
  //                   const caseSize = caseSizeIds.find(
  //                     (cs) => cs.id === req.caseSizeId,
  //                   );

  //                   if (!caseSize) {
  //                     throw new Error(
  //                       `Case size with id ${req.caseSizeId} not found`,
  //                     );
  //                   }

  //                   // Calculate the maximum amount of this case size that can fit into the current capacity
  //                   const maxAmountForCaseSize = Math.floor(
  //                     currentCapacity / caseSize.caseCubic,
  //                   );

  //                   // Determine how much of the requirement amount can be assigned to this location
  //                   let splitAmount = Math.min(
  //                     req.amount,
  //                     maxAmountForCaseSize,
  //                   );

  //                   // Adjust currentCapacity and the requirement amount
  //                   currentCapacity -= splitAmount * caseSize.caseCubic;
  //                   req.amount -= splitAmount;

  //                   // Ensure that any remaining requirement amount is allocated
  //                   if (i === numberOfSplite - 1 && req.amount > 0) {
  //                     splitAmount += req.amount;
  //                     req.amount = 0;
  //                   }

  //                   await prisma.requirement.create({
  //                     data: {
  //                       ...req,
  //                       amount: splitAmount,
  //                       locationId: createdLocation.id,
  //                     },
  //                   });
  //                 }
  //               }
  //             }
  //           }
  //         } else {
  //           // create new
  //           if (numberOfSplite === 1) {
  //             const createdLocation = await prisma.location.create({
  //               data: locationData,
  //             });

  //             // Update Requirements with the created locationId
  //             for (const req of requirements) {
  //               await prisma.requirement.create({
  //                 data: {
  //                   ...req,
  //                   locationId: createdLocation.id,
  //                 },
  //               });
  //             }
  //           } else if (numberOfSplite > 1) {
  //             let remainingCapacity = totalCapacity;
  //             const caseSizeIds = await prisma.caseSize.findMany({
  //               select: { id: true, caseCubic: true },
  //             });

  //             for (let i = 0; i < numberOfSplite; i++) {
  //               let currentCapacity = Math.min(
  //                 remainingCapacity,
  //                 truckSize.containerCubic,
  //               );

  //               remainingCapacity -= currentCapacity;

  //               const createdLocation = await prisma.location.create({
  //                 data: {
  //                   ...locationData,
  //                   capacity: currentCapacity,
  //                 },
  //               });

  //               // Calculate the split amount for each requirement based on the current capacity
  //               for (const req of requirements) {
  //                 const caseSize = caseSizeIds.find(
  //                   (cs) => cs.id === req.caseSizeId,
  //                 );

  //                 if (!caseSize) {
  //                   throw new Error(
  //                     `Case size with id ${req.caseSizeId} not found`,
  //                   );
  //                 }

  //                 // Calculate the maximum amount of this case size that can fit into the current capacity
  //                 const maxAmountForCaseSize = Math.floor(
  //                   currentCapacity / caseSize.caseCubic,
  //                 );

  //                 // Determine how much of the requirement amount can be assigned to this location
  //                 let splitAmount = Math.min(req.amount, maxAmountForCaseSize);

  //                 // Adjust currentCapacity and the requirement amount
  //                 currentCapacity -= splitAmount * caseSize.caseCubic;
  //                 req.amount -= splitAmount;

  //                 // Ensure that any remaining requirement amount is allocated
  //                 if (i === numberOfSplite - 1 && req.amount > 0) {
  //                   splitAmount += req.amount;
  //                   req.amount = 0;
  //                 }

  //                 await prisma.requirement.create({
  //                   data: {
  //                     ...req,
  //                     amount: splitAmount,
  //                     locationId: createdLocation.id,
  //                   },
  //                 });
  //               }
  //             }
  //           }
  //         }
  //       }
  //     });

  //     return 'Created successfull';
  //   } catch (error) {
  //     throw error;
  //   }
  // }

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
              contains: licensePlate.toLowerCase(),
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
          Requirement: {
            include: {
              caseSize: true,
            },
          },
        },
      });

      const updatedLocations = locations.map((location) => {
        const newCapacity = location.Requirement.reduce(
          (total, req) => total + req.caseSize.caseCubic * req.amount,
          0,
        );

        return {
          ...location,
          capacity: newCapacity, // Update capacity
          isAssign: true,
        };
      });

      // Sort the locations based on partOfDay and priority
      updatedLocations.sort((a, b) => {
        const partOfDayComparison =
          partOfDayOrder[a.partOfDay] - partOfDayOrder[b.partOfDay];
        if (partOfDayComparison !== 0) return partOfDayComparison;

        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      return updatedLocations;
    } else {
      const locations = await this.prisma.location.findMany({
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
                    contains: query.toLowerCase(),
                  },
                },
                {
                  se: {
                    contains: query.toLowerCase(),
                  },
                },
                {
                  locationName: {
                    contains: query.toLowerCase(),
                  },
                },
              ]
            : undefined,
        },
        include: {
          zone: true,
          truckSize: true,
          Requirement: {
            include: {
              caseSize: true,
            },
          },
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

      const updatedLocations = locations.map((location) => {
        // Calculate the sum of `caseCubic * amount` for each Requirement
        const totalCapacity = location.Requirement.reduce((sum, req) => {
          return sum + req.amount * req.caseSize.caseCubic;
        }, 0);

        return {
          ...location,
          capacity: totalCapacity, // Update the capacity with the calculated sum
          isAssign: assignedLocationIds.has(location.id),
        };
      });

      // Sort the locations based on partOfDay and priority
      updatedLocations.sort((a, b) => {
        const partOfDayComparison =
          partOfDayOrder[a.partOfDay] - partOfDayOrder[b.partOfDay];
        if (partOfDayComparison !== 0) return partOfDayComparison;

        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      if (isAssign !== undefined) {
        const isAssignValue = isAssign === 'true';
        return updatedLocations.filter(
          (location) => location.isAssign === isAssignValue,
        );
      }

      return updatedLocations;
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

      for (const locationId of deliveryRouteCalculationDateIds) {
        await this.prisma.location.update({
          where: { id: locationId },
          data: { isAssign: true },
        });
      }

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
          await this.prisma.location.update({
            where: { id: location },
            data: { isAssign: false },
          });

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
  // rith
  async deleteLocationDrc(deleteLocationDrcDto: DeleteLocationDrcDto) {
    // Unassign location to truck
    const {
      latitude,
      longitude,
      deliveryRouteCalculationDateId,
      partOfDay,
      priority,
    } = deleteLocationDrcDto;
    await this.prisma.$transaction(async (prisma) => {
      const locations = await prisma.location.findMany({
        where: {
          longitude,
          latitude,
          deliveryRouteCalculationDateId,
          partOfDay,
          priority,
        },
        select: {
          id: true,
        },
      });
      for (const isAssigned of locations) {
        const assigned = await prisma.assignLocationToTruck.findFirst({
          where: {
            locationId: isAssigned.id,
            deliveryRouteCalculationDateId,
          },
        });
        if (assigned) {
          await prisma.assignLocationToTruck.deleteMany({
            where: {
              locationId: isAssigned.id,
              deliveryRouteCalculationDateId,
            },
          });
        }
      }
      // Start delete
      for (const location of locations) {
        await prisma.location.delete({
          where: {
            id: location.id,
          },
        });
      }
    });
    return 'Deleted successfully';
  }

  async updateLocationPartOfDay(
    id: number,
    updatePartOfDayDto: UpdatePartOfDayDto,
  ) {
    // start update
    const isLocation = await this.prisma.location.findUnique({ where: { id } });
    if (!isLocation) {
      throw new NotFoundException();
    }
    // update
    await this.prisma.location.update({
      where: { id },
      data: { partOfDay: updatePartOfDayDto.partOfDay },
    });
    return 'Updated successfully';
  }

  async getAllWarehouse() {
    return await this.prisma.warehouse.findMany();
  }

  async autoLocation(deliveryRouteCalculationDateId: number) {
    try {
      // Retrieve unique values for zoneId, truckSizeId, partOfDay, and priority
      const fields = await this.prisma.location.findMany({
        where: { deliveryRouteCalculationDateId },
        select: {
          zoneId: true,
          truckSizeId: true,
          partOfDay: true,
          priority: true,
        },
      });

      const uniqueZoneIds = [...new Set(fields.map((field) => field.zoneId))];
      const uniqueTruckSizeIds = [
        ...new Set(fields.map((field) => field.truckSizeId)),
      ];
      const uniquePartOfDays = [
        ...new Set(fields.map((field) => field.partOfDay)),
      ];
      const uniquePriorities = [
        ...new Set(fields.map((field) => field.priority)),
      ];

      // Store in DB
      for (const zoneId of uniqueZoneIds) {
        for (const truckSizeId of uniqueTruckSizeIds) {
          for (const partOfDayValue of uniquePartOfDays) {
            for (const priorityValue of uniquePriorities) {
              // Find locations that match these conditions
              const matchingLocations = await this.prisma.location.findMany({
                where: {
                  deliveryRouteCalculationDateId,
                  zoneId,
                  truckSizeId,
                  partOfDay: partOfDayValue,
                  priority: priorityValue,
                  isAssign: false, // ensure the location is not yet assigned
                },
              });

              // Insert into autoAssign for each matching location
              const autoAssignPromises = matchingLocations.map((location) =>
                this.prisma.autoAssign.create({
                  data: {
                    deliveryRouteCalculationDateId,
                    zoneId,
                    truckSizeId,
                    partOfDay: partOfDayValue,
                    priority: priorityValue,
                    locationId: location.id,
                  },
                }),
              );

              // Execute all insertions
              await this.prisma.$transaction(autoAssignPromises);
            }
          }
        }
      }
      // await this.prisma.autoAssign.deleteMany();

      const groupedResults = await this.prisma.autoAssign.groupBy({
        by: ['zoneId', 'truckSizeId', 'partOfDay', 'priority'],
        where: { deliveryRouteCalculationDateId },
        _count: {
          locationId: true, // Count the number of locations for each unique combination
        },
      });
      const resultsWithLocationIds = await Promise.all(
        groupedResults.map(async (group) => {
          const locationIds = await this.prisma.autoAssign.findMany({
            where: {
              deliveryRouteCalculationDateId,
              zoneId: group.zoneId,
              truckSizeId: group.truckSizeId,
              partOfDay: group.partOfDay,
              priority: group.priority,
            },
            select: {
              locationId: true,
            },
          });

          return {
            ...group,
            locationIds: locationIds.map((loc) => loc.locationId),
          };
        }),
      );

      return resultsWithLocationIds;
    } catch (error) {
      console.error('Error in autoAssign:', error);
      throw new Error('Auto-assignment failed.');
    }
  }
  async autoAssign(deliveryRouteCalculationDateId: number) {
    try {
      // validation
      const isAssigned = await this.prisma.assignLocationToTruck.findMany({
        where: { deliveryRouteCalculationDateId },
      });
      if (isAssigned.length > 0) {
        throw new BadRequestException('U have assigned some location already!');
      }
      // Retrieve unique values for zoneId, truckSizeId, partOfDay, and priority
      const fields = await this.prisma.location.findMany({
        where: { deliveryRouteCalculationDateId },
        select: {
          zoneId: true,
          truckSizeId: true,
          partOfDay: true,
          priority: true,
        },
      });

      const uniqueZoneIds = [...new Set(fields.map((field) => field.zoneId))];
      const uniqueTruckSizeIds = [
        ...new Set(fields.map((field) => field.truckSizeId)),
      ];
      const uniquePartOfDays = [
        ...new Set(fields.map((field) => field.partOfDay)),
      ];
      const uniquePriorities = [
        ...new Set(fields.map((field) => field.priority)),
      ];

      for (const zoneId of uniqueZoneIds) {
        for (const truckSizeId of uniqueTruckSizeIds) {
          for (const partOfDayValue of uniquePartOfDays) {
            for (const priorityValue of uniquePriorities) {
              // Retrieve locations matching these criteria
              const locations = await this.prisma.location.findMany({
                where: {
                  deliveryRouteCalculationDateId,
                  zoneId,
                  truckSizeId,
                  partOfDay: partOfDayValue,
                  priority: priorityValue,
                  isAssign: false,
                },
              });

              if (locations.length > 0) {
                // Retrieve trucks matching these criteria
                const trucks = await this.prisma.truckByDate.findMany({
                  where: {
                    deliveryRouteCalculationDateId,
                    truck: {
                      zoneId,
                      truckSizeId,
                      status: 'AVAILABLE',
                    },
                  },
                  include: {
                    truck: true,
                  },
                });
                const trucksLength = trucks.length;
                const locationsLength = locations.length;
                // choose
                const finalLength =
                  trucksLength <= locationsLength
                    ? trucksLength
                    : locationsLength;
                for (let i = 0; i < finalLength; i++) {
                  const location = locations[i];
                  const truck = trucks[i];
                  await this.prisma.assignLocationToTruck.create({
                    data: {
                      locationId: location.id,
                      truckByDateId: truck.id,
                      deliveryRouteCalculationDateId:
                        deliveryRouteCalculationDateId,
                    },
                  });
                }
              }
            }
          }
        }
      }

      await this.prisma.autoAssign.deleteMany();
      await this.prisma.autoTruck.deleteMany();
      return 'success';
    } catch (error) {
      console.error('Error in autoAssign:', error);
      throw error;
    }
  }
  async exportExcelFile(id: number): Promise<any[]> {
    const response = await this.prisma.assignLocationToTruck.findMany({
      where: { deliveryRouteCalculationDateId: id },
      include: {
        location: {
          include: {
            Requirement: {
              include: {
                caseSize: true,
              },
            },
            zone: true,
            truckSize: true,
          },
        },
        truckByDate: {
          include: {
            truck: true,
          },
        },
      },
    });

    const caseSizes = await this.prisma.caseSize.findMany();

    // return response;

    const formattedData = response.map((item) => {
      const requirementsMap = caseSizes.reduce(
        (acc, caseSize) => {
          const requirement = item.location.Requirement.find(
            (r) => r.caseSizeId === caseSize.id,
          );
          acc[caseSize.name] = requirement ? requirement.amount : ''; // Replace null with an empty string
          return acc;
        },
        {} as Record<string, number | string>,
      );

      return {
        code: item.location.code ?? '',
        zone: item.location.zone?.code ?? '',
        truckSize: item.location.truckSize?.name ?? '',
        locationName: item.location.locationName ?? '',
        phone: item.location.phone ?? '',
        se: item.location.se ?? '',
        latitude: item.location.latitude ?? '',
        longitude: item.location.longitude ?? '',
        deliveryDate: item.location.deliveryDate ?? '',
        paymentTerm: item.location.paymentTerm ?? '',
        partOfDay: item.location.partOfDay ?? '',
        priority: item.location.priority ?? '',
        licensePlate: item.truckByDate.truck.licensePlate ?? '', // Add licensePlate
        documentType: item.location.documentType ?? '',
        documentNumber: item.location.documentNumber ?? '',
        documentDate: item.location.documentDate ?? '',
        sla: item.location.sla ?? '',
        uploaddTime: item.location.uploaddTime ?? '',
        homeNo: item.location.homeNo ?? '',
        streetNo: item.location.streetNo ?? '',
        village: item.location.village ?? '',
        sangkat: item.location.sangkat ?? '',
        khan: item.location.khan ?? '',
        hotSpot: item.location.hotSpot ?? '',
        direction: item.location.direction ?? '',
        area: item.location.area ?? '',
        region: item.location.region ?? '',
        division: item.location.division ?? '',
        ...requirementsMap, // Spread the requirement fields directly into the object
        flag: '',
      };
    });

    return formattedData;
  }
  async generateExcel(jsonData: any[]): Promise<any> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    if (jsonData.length > 0) {
      const columns = Object.keys(jsonData[0]).map((key) => ({
        header: key,
        key: key,
      }));

      worksheet.columns = columns;
      worksheet.addRows(jsonData);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
  public convertJsonToExcel(
    jsonData: any[],
    sheetName: string = 'Sheet1',
  ): Buffer {
    try {
      // Create a new workbook and a worksheet
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();

      // Append the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate a buffer for the workbook
      const excelBuffer: Buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx',
      });

      return excelBuffer;
    } catch (error) {
      console.error('Error converting JSON to Excel:', error);
      throw new Error('Failed to convert JSON to Excel');
    }
  }

  async getAllCaseNames() {
    const cases = await this.prisma.caseSize.findMany({
      select: { name: true },
    });
    return cases;
  }

  async deleteSingleLocation(id: number) {
    try {
      // validation
      const location = await this.prisma.location.findUnique({ where: { id } });
      if (!location) {
        throw new NotFoundException();
      }
      // unassign
      await this.prisma.assignLocationToTruck.deleteMany({
        where: { locationId: location.id },
      });
      // start delete
      await this.prisma.location.delete({ where: { id: location.id } });
      return {
        message: 'Deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }
  async updateSingleLocation(id: number, data: any) {
    try {
      // find location id by code
      const locationId = await this.prisma.location.findUnique({
        where: { code: data.code },
        select: { id: true },
      });
      // get assign tuck
      const assigned = await this.prisma.assignLocationToTruck.findFirst({
        where: {
          locationId: locationId.id,
          deliveryRouteCalculationDateId: id,
        },
        include: {
          truckByDate: {
            include: {
              truck: {
                select: {
                  licensePlate: true,
                },
              },
            },
          },
        },
      });
      // change zoneId to zoneCode
      const zoneId = data.zoneId;
      const truckSizeId = data.truckSizeId;
      if (!zoneId || !truckSizeId) {
        throw new NotFoundException();
      }
      const zone = await this.prisma.zone.findUnique({
        where: { id: +zoneId },
        select: { code: true },
      });
      const truckSize = await this.prisma.truckSize.findUnique({
        where: { id: +truckSizeId },
        select: { name: true },
      });
      let newData = [
        {
          ...data,
          zone: zone.code,
          truckSize: truckSize.name,
          code: undefined,
        },
      ];
      if (assigned?.truckByDate?.truck?.licensePlate) {
        newData = [
          {
            ...data,
            zone: zone.code,
            truckSize: truckSize.name,
            licensePlate: assigned.truckByDate.truck.licensePlate,
            code: undefined,
          },
        ];
      }

      await this.prisma.$transaction(async (prisma: PrismaClient) => {
        // delete old location
        const location = await prisma.location.findUnique({
          where: { id: locationId.id },
        });
        if (!location) {
          throw new NotFoundException();
        }
        // unassign
        await prisma.assignLocationToTruck.deleteMany({
          where: { locationId: location.id },
        });
        // start delete
        await prisma.location.delete({ where: { id: location.id } });
        // create new
        await this.handleNewLocations(newData, id, prisma);
      });
      return 'update succesfully';
    } catch (error) {
      throw error;
    }
  }
}
