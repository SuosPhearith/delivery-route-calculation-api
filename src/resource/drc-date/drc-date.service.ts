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
  // rith
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

      await this.prisma.$transaction(async (prisma) => {
        const oldLocations = await prisma.location.findMany({
          where: { deliveryRouteCalculationDateId: id },
        });

        // Check locations to delete
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
            const existsInJsonData = jsonData.some(
              (newLoc) =>
                newLoc.latitude === oldLoc.latitude &&
                newLoc.longitude === oldLoc.longitude,
            );
            return !existsInJsonData;
          })
          .map((oldLoc) => oldLoc.id);

        if (filteredIds.length > 0) {
          for (const location of filteredIds) {
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

          // Fetch all case sizes dynamically
          const caseSizes = await prisma.caseSize.findMany();

          if (!caseSizes || caseSizes.length === 0) {
            throw new NotFoundException('No case sizes found');
          }

          // Calculate total capacity dynamically
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
            flag: direction.flag || '',
          };

          // if(direction.licensePlate)

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

            const ids = oldCapacity.map(({ id }) => id);
            const epsilon = 1e-10;
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
              const getAssignedIds =
                await prisma.assignLocationToTruck.findMany({
                  where: { deliveryRouteCalculationDateId: id },
                  select: { locationId: true },
                });

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
                const createdLocation = await prisma.location.create({
                  data: locationData,
                });

                // Update Requirements with the created locationId
                for (const req of requirements) {
                  await prisma.requirement.create({
                    data: {
                      ...req,
                      locationId: createdLocation.id,
                    },
                  });
                }
              } else if (numberOfSplite > 1) {
                // have error flow
                // let remainingCapacity = totalCapacity;

                // for (let i = 0; i < numberOfSplite; i++) {
                //   const currentCapacity = Math.min(
                //     remainingCapacity,
                //     truckSize.containerCubic,
                //   );

                //   remainingCapacity -= currentCapacity;

                //   const createdLocation = await prisma.location.create({
                //     data: {
                //       ...locationData,
                //       capacity: currentCapacity,
                //     },
                //   });

                //   // Update Requirements with the created locationId
                //   for (const req of requirements) {
                //     await prisma.requirement.create({
                //       data: {
                //         ...req,
                //         locationId: createdLocation.id,
                //       },
                //     });
                //   }
                // }
                let remainingCapacity = totalCapacity;
                const caseSizeIds = await prisma.caseSize.findMany({
                  select: { id: true, caseCubic: true },
                });

                for (let i = 0; i < numberOfSplite; i++) {
                  let currentCapacity = Math.min(
                    remainingCapacity,
                    truckSize.containerCubic,
                  );

                  remainingCapacity -= currentCapacity;

                  const createdLocation = await prisma.location.create({
                    data: {
                      ...locationData,
                      capacity: currentCapacity,
                    },
                  });

                  // Calculate the split amount for each requirement based on the current capacity
                  for (const req of requirements) {
                    const caseSize = caseSizeIds.find(
                      (cs) => cs.id === req.caseSizeId,
                    );

                    if (!caseSize) {
                      throw new Error(
                        `Case size with id ${req.caseSizeId} not found`,
                      );
                    }

                    // Calculate the maximum amount of this case size that can fit into the current capacity
                    const maxAmountForCaseSize = Math.floor(
                      currentCapacity / caseSize.caseCubic,
                    );

                    // Determine how much of the requirement amount can be assigned to this location
                    let splitAmount = Math.min(
                      req.amount,
                      maxAmountForCaseSize,
                    );

                    // Adjust currentCapacity and the requirement amount
                    currentCapacity -= splitAmount * caseSize.caseCubic;
                    req.amount -= splitAmount;

                    // Ensure that any remaining requirement amount is allocated
                    if (i === numberOfSplite - 1 && req.amount > 0) {
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
                }
              }
            }
          } else {
            if (numberOfSplite === 1) {
              const createdLocation = await prisma.location.create({
                data: locationData,
              });

              // Update Requirements with the created locationId
              for (const req of requirements) {
                await prisma.requirement.create({
                  data: {
                    ...req,
                    locationId: createdLocation.id,
                  },
                });
              }
            } else if (numberOfSplite > 1) {
              // console.log(requirements);
              // let remainingCapacity = totalCapacity;
              // const caseSizeIds = await prisma.caseSize.findMany({
              //   select: { id: true, caseCubic: true },
              // });
              // console.log(caseSizeIds);
              // console.log(truckSize.containerCubic);

              // for (let i = 0; i < numberOfSplite; i++) {
              //   const currentCapacity = Math.min(
              //     remainingCapacity,
              //     truckSize.containerCubic,
              //   );

              //   remainingCapacity -= currentCapacity;

              //   const createdLocation = await prisma.location.create({
              //     data: {
              //       ...locationData,
              //       capacity: currentCapacity,
              //     },
              //   });

              //   // Update Requirements with the created locationId
              //   for (const req of requirements) {
              //     await prisma.requirement.create({
              //       data: {
              //         ...req,
              //         locationId: createdLocation.id,
              //       },
              //     });
              //   }
              // }
              let remainingCapacity = totalCapacity;
              const caseSizeIds = await prisma.caseSize.findMany({
                select: { id: true, caseCubic: true },
              });

              for (let i = 0; i < numberOfSplite; i++) {
                let currentCapacity = Math.min(
                  remainingCapacity,
                  truckSize.containerCubic,
                );

                remainingCapacity -= currentCapacity;

                const createdLocation = await prisma.location.create({
                  data: {
                    ...locationData,
                    capacity: currentCapacity,
                  },
                });

                // Calculate the split amount for each requirement based on the current capacity
                for (const req of requirements) {
                  const caseSize = caseSizeIds.find(
                    (cs) => cs.id === req.caseSizeId,
                  );

                  if (!caseSize) {
                    throw new Error(
                      `Case size with id ${req.caseSizeId} not found`,
                    );
                  }

                  // Calculate the maximum amount of this case size that can fit into the current capacity
                  const maxAmountForCaseSize = Math.floor(
                    currentCapacity / caseSize.caseCubic,
                  );

                  // Determine how much of the requirement amount can be assigned to this location
                  let splitAmount = Math.min(req.amount, maxAmountForCaseSize);

                  // Adjust currentCapacity and the requirement amount
                  currentCapacity -= splitAmount * caseSize.caseCubic;
                  req.amount -= splitAmount;

                  // Ensure that any remaining requirement amount is allocated
                  if (i === numberOfSplite - 1 && req.amount > 0) {
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
              }
            }
          }
        }
      });

      return 'Created successfull';
    } catch (error) {
      throw error;
    }
  }

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
  //     // Fetch all existing locations for the given deliveryRouteCalculationDateId
  //     await this.prisma.$transaction(async (prisma) => {
  //       const oldLocations = await prisma.location.findMany({
  //         where: { deliveryRouteCalculationDateId: id },
  //       });
  //       // check to delete
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
  //           // Check if the location in oldLocationsForCheck exists in jsonData
  //           const existsInJsonData = jsonData.some(
  //             (newLoc) =>
  //               newLoc.latitude === oldLoc.latitude &&
  //               newLoc.longitude === oldLoc.longitude,
  //           );

  //           // Return true if it does NOT exist in jsonData (i.e., we want to keep it)
  //           return !existsInJsonData;
  //         })
  //         .map((oldLoc) => oldLoc.id); // Extract the ids of the filtered locations

  //       if (filteredIds.length > 0) {
  //         for (const location of filteredIds) {
  //           console.log(location + '  ' + id);

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
  //         // need to modify this
  //         // Fetch all case sizes dynamically
  //         const caseSizes = await prisma.caseSize.findMany();

  //         if (!caseSizes || caseSizes.length === 0) {
  //           throw new NotFoundException('No case sizes found');
  //         }

  //         // Calculate total capacity dynamically
  //         let totalCapacity = 0;

  //         caseSizes.forEach((caseSize) => {
  //           const caseName = caseSize.name as keyof typeof direction; // Make sure the case name exists in the direction object
  //           const caseQuantity = direction[caseName] as number; // Get the corresponding quantity from direction

  //           if (caseQuantity && caseSize.caseCubic) {
  //             totalCapacity += caseSize.caseCubic * caseQuantity;
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
  //           // Extract an array of ids
  //           const ids = oldCapacity.map(({ id }) => id);
  //           const epsilon = 1e-10; // A small tolerance value
  //           const areEqual = Math.abs(totalOldCapacity - capacity) < epsilon;
  //           if (areEqual) {
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
  //             // unassign
  //             const getAssignedIds =
  //               await prisma.assignLocationToTruck.findMany({
  //                 where: { deliveryRouteCalculationDateId: id },
  //                 select: { locationId: true },
  //               });
  //             // Extract an array of ids
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
  //             if (numberOfSplite === 1) {
  //               await prisma.location.create({
  //                 data: { ...locationData, capacity: totalCapacity },
  //               });
  //             } else if (numberOfSplite > 1) {
  //               let remainingCapacity = totalCapacity;

  //               for (let i = 0; i < numberOfSplite; i++) {
  //                 // Determine the capacity for the current split
  //                 const currentCapacity = Math.min(
  //                   remainingCapacity,
  //                   truckSize.containerCubic,
  //                 );

  //                 // Reduce the remaining capacity by the current split's capacity
  //                 remainingCapacity -= currentCapacity;

  //                 await prisma.location.create({
  //                   data: { ...locationData, capacity: currentCapacity },
  //                 });
  //               }
  //             }
  //           }
  //         } else {
  //           if (numberOfSplite === 1) {
  //             await prisma.location.create({
  //               data: { ...locationData, capacity: totalCapacity },
  //             });
  //           } else if (numberOfSplite > 1) {
  //             let remainingCapacity = totalCapacity;

  //             for (let i = 0; i < numberOfSplite; i++) {
  //               // Determine the capacity for the current split
  //               const currentCapacity = Math.min(
  //                 remainingCapacity,
  //                 truckSize.containerCubic,
  //               );

  //               // Reduce the remaining capacity by the current split's capacity
  //               remainingCapacity -= currentCapacity;

  //               await prisma.location.create({
  //                 data: { ...locationData, capacity: currentCapacity },
  //               });
  //             }
  //           }
  //         }
  //       }
  //     });
  //     return 'Created successfully';
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

  //   const priorityOrder = {
  //     CRITICAL: 1,
  //     HIGH: 2,
  //     MEDIUM: 3,
  //     LOW: 4,
  //     TRIVIAL: 5,
  //   };

  //   const partOfDayOrder = {
  //     MORNING: 1,
  //     AFTERNOON: 2,
  //     EVENING: 3,
  //     NIGHT: 4,
  //   };

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
  //         Requirement: {
  //           include: {
  //             caseSize: true,
  //           },
  //         },
  //       },
  //     });

  //     const updatedLocations = locations.map((location) => ({
  //       ...location,
  //       isAssign: true,
  //     }));

  //     // Sort the locations based on partOfDay and priority
  //     updatedLocations.sort((a, b) => {
  //       const partOfDayComparison =
  //         partOfDayOrder[a.partOfDay] - partOfDayOrder[b.partOfDay];
  //       if (partOfDayComparison !== 0) return partOfDayComparison;

  //       return priorityOrder[a.priority] - priorityOrder[b.priority];
  //     });

  //     return updatedLocations;
  //   } else {
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
  //         Requirement: {
  //           include: {
  //             caseSize: true,
  //           },
  //         },
  //       },
  //     });

  //     const AssignLocationToTruckData =
  //       await this.prisma.assignLocationToTruck.findMany({
  //         where: {
  //           deliveryRouteCalculationDateId: +deliveryRouteCalculationDateId,
  //         },
  //       });

  //     const assignedLocationIds = new Set(
  //       AssignLocationToTruckData.map((item) => item.locationId),
  //     );

  //     const updatedResponse = response.map((location) => {
  //       return {
  //         ...location,
  //         isAssign: assignedLocationIds.has(location.id),
  //       };
  //     });

  //     // Sort the locations based on partOfDay and priority
  //     updatedResponse.sort((a, b) => {
  //       const partOfDayComparison =
  //         partOfDayOrder[a.partOfDay] - partOfDayOrder[b.partOfDay];
  //       if (partOfDayComparison !== 0) return partOfDayComparison;

  //       return priorityOrder[a.priority] - priorityOrder[b.priority];
  //     });

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
  async deleteLocationDrc(deleteLocationDrcDto: DeleteLocationDrcDto) {
    // Unassign location to truck
    const { latitude, longitude, deliveryRouteCalculationDateId } =
      deleteLocationDrcDto;
    await this.prisma.$transaction(async (prisma) => {
      const locations = await prisma.location.findMany({
        where: {
          longitude,
          latitude,
          deliveryRouteCalculationDateId,
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
  // async autoAssign(deliveryRouteCalculationDateId: number) {
  //   // await this.prisma.autoTruck.deleteMany();
  //   // await this.prisma.autoAssign.deleteMany();
  //   // return 'hello';
  //   try {
  //     // Retrieve unique values for zoneId, truckSizeId, partOfDay, and priority
  //     const fields = await this.prisma.location.findMany({
  //       where: { deliveryRouteCalculationDateId },
  //       select: {
  //         zoneId: true,
  //         truckSizeId: true,
  //         partOfDay: true,
  //         priority: true,
  //       },
  //     });

  //     const uniqueZoneIds = [...new Set(fields.map((field) => field.zoneId))];
  //     const uniqueTruckSizeIds = [
  //       ...new Set(fields.map((field) => field.truckSizeId)),
  //     ];
  //     const uniquePartOfDays = [
  //       ...new Set(fields.map((field) => field.partOfDay)),
  //     ];
  //     const uniquePriorities = [
  //       ...new Set(fields.map((field) => field.priority)),
  //     ];

  //     // Store in DB
  //     for (const zoneId of uniqueZoneIds) {
  //       for (const truckSizeId of uniqueTruckSizeIds) {
  //         for (const partOfDayValue of uniquePartOfDays) {
  //           for (const priorityValue of uniquePriorities) {
  //             // Find locations that match these conditions
  //             const matchingLocations = await this.prisma.location.findMany({
  //               where: {
  //                 deliveryRouteCalculationDateId,
  //                 zoneId,
  //                 truckSizeId,
  //                 partOfDay: partOfDayValue,
  //                 priority: priorityValue,
  //                 isAssign: false, // ensure the location is not yet assigned
  //               },
  //             });

  //             // Insert into autoAssign for each matching location
  //             const autoAssignPromises = matchingLocations.map((location) =>
  //               this.prisma.autoAssign.create({
  //                 data: {
  //                   deliveryRouteCalculationDateId,
  //                   zoneId,
  //                   truckSizeId,
  //                   partOfDay: partOfDayValue,
  //                   priority: priorityValue,
  //                   locationId: location.id,
  //                 },
  //               }),
  //             );

  //             // Execute all insertions
  //             await this.prisma.$transaction(autoAssignPromises);
  //           }
  //         }
  //       }
  //     }

  //     // Assuming truckByDates is the result of your Prisma query
  //     const truckByDates = await this.prisma.truckByDate.findMany({
  //       where: { deliveryRouteCalculationDateId },
  //       select: {
  //         truck: {
  //           select: {
  //             zoneId: true,
  //             truckSizeId: true,
  //             truckOwnershipTypeId: true,
  //             id: true,
  //             // Add other fields if needed
  //           },
  //         },
  //       },
  //     });

  //     // Map and retrieve unique values for each field from truckByDates
  //     const uniqueZoneIdsTruck = [
  //       ...new Set(truckByDates.map((entry) => entry.truck.zoneId)),
  //     ];
  //     const uniqueTruckSizeIdsTruck = [
  //       ...new Set(truckByDates.map((entry) => entry.truck.truckSizeId)),
  //     ];
  //     const uniqueTruckOwnershipTypeIdsTruck = [
  //       ...new Set(
  //         truckByDates.map((entry) => entry.truck.truckOwnershipTypeId),
  //       ),
  //     ];

  //     for (const truckOwnershipTypeId of uniqueTruckOwnershipTypeIdsTruck) {
  //       for (const zoneId of uniqueZoneIdsTruck) {
  //         for (const truckSizeId of uniqueTruckSizeIdsTruck) {
  //           // Find locations that match these conditions
  //           const matchingTrucks = await this.prisma.truckByDate.findMany({
  //             where: {
  //               deliveryRouteCalculationDateId,
  //               truck: {
  //                 zoneId,
  //                 truckSizeId,
  //                 truckOwnershipTypeId,
  //               },
  //             },
  //             include: {
  //               truck: true,
  //             },
  //           });

  //           // Insert into autoAssign for each matching location
  //           const autoAssignPromises = matchingTrucks.map((truck) =>
  //             this.prisma.autoTruck.create({
  //               data: {
  //                 deliveryRouteCalculationDateId:
  //                   deliveryRouteCalculationDateId,
  //                 zoneId: truck.truck.zoneId,
  //                 truckOwnershipTypeId: truck.truck.truckOwnershipTypeId,
  //                 truckSizeId: truck.truck.truckSizeId,
  //                 truckId: truck.truck.id,
  //               },
  //             }),
  //           );

  //           // Execute all insertions
  //           await this.prisma.$transaction(autoAssignPromises);
  //         }
  //       }
  //     }

  //     // start assign
  //     for (const zoneId of uniqueZoneIds) {
  //       for (const truckSizeId of uniqueTruckSizeIds) {
  //         for (const partOfDayValue of uniquePartOfDays) {
  //           for (const priorityValue of uniquePriorities) {
  //             // get locations
  //             const locations = await this.prisma.location.findMany({
  //               where: {
  //                 deliveryRouteCalculationDateId,
  //                 zoneId,
  //                 truckSizeId,
  //                 partOfDay: partOfDayValue,
  //                 priority: priorityValue,
  //                 isAssign: false,
  //               },
  //             });
  //             for (const location of locations) {
  //               const locationsLength = locations.length;
  //               // get truck
  //               const trucks = await this.prisma.truckByDate.findMany({
  //                 where: {
  //                   deliveryRouteCalculationDateId,
  //                   truck: {
  //                     zoneId,
  //                     truckSizeId,
  //                   },
  //                 },
  //                 include: {
  //                   truck: true,
  //                 },
  //               });

  //               if (trucks.length > 0 && locationsLength > 0) {
  //                 // Loop through locations
  //                 for (let i = 0; i < locationsLength; i++) {
  //                   // Loop through trucks
  //                   for (const truck of trucks) {
  //                     const location = locations[i];

  //                     // assign location
  //                     const existingAssignment =
  //                       await this.prisma.assignLocationToTruck.findUnique({
  //                         where: {
  //                           locationId_deliveryRouteCalculationDateId: {
  //                             locationId: location.id,
  //                             deliveryRouteCalculationDateId:
  //                               deliveryRouteCalculationDateId,
  //                           },
  //                         },
  //                       });

  //                     if (!existingAssignment) {
  //                       await this.prisma.assignLocationToTruck.create({
  //                         data: {
  //                           locationId: location.id,
  //                           truckByDateId: truck.id,
  //                           deliveryRouteCalculationDateId:
  //                             deliveryRouteCalculationDateId,
  //                         },
  //                       });
  //                     }
  //                   }
  //                 }
  //               } else {
  //                 console.log('No trucks or locations found.');
  //               }
  //             }
  //           }
  //         }
  //       }
  //     }

  //     await this.prisma.autoAssign.deleteMany();
  //     await this.prisma.autoTruck.deleteMany();
  //     return 'success';

  //     // return resultsWithLocationIds;
  //   } catch (error) {
  //     console.error('Error in autoAssign:', error);
  //     throw new Error('Auto-assignment failed.');
  //   }
  // }
  async autoAssign(deliveryRouteCalculationDateId: number) {
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
      throw new Error('Auto-assignment failed.');
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
        zone: item.location.zone?.code ?? '',
        truckSize: item.location.truckSize?.name ?? '',
        locationName: item.location.locationName ?? '',
        phone: item.location.phone ?? '',
        se: item.location.se ?? '',
        latitude: item.location.latitude ?? '',
        longitude: item.location.longitude ?? '',
        deliveryDate: item.location.deliveryDate
          ? new Date(item.location.deliveryDate).toLocaleDateString()
          : '',
        paymentTerm: item.location.paymentTerm ?? '',
        partOfDay: item.location.partOfDay ?? '',
        priority: item.location.priority ?? '',
        licensePlate: item.truckByDate.truck.licensePlate ?? '', // Add licensePlate
        documentType: item.location.documentType ?? '',
        documentNumber: item.location.documentNumber ?? '',
        documentDate: item.location.documentDate
          ? new Date(item.location.documentDate).toLocaleDateString()
          : '',
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
}
