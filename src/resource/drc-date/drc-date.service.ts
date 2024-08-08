import {
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

@Injectable()
export class DrcDateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}
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
  // async createDrc(file: any) {
  //   try {
  //     const result = this.fileUploadService.handleFileUpload(file);
  //     const jsonData = this.convertExcelToJson(result.path);

  //     // Validate each drc object
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

  //     const groupLocation = await this.prisma.groupLocation.create({
  //       data: { group: uuidv4(), deliveryRouteCalculationDateId: 1 },
  //     });

  //     const filteredData = jsonData.map((direction: any) => {
  //       const zone = await this.prisma.zone.findFirst({
  //         where: { code: direction.zone },
  //       });
  //       const truckSize = await this.prisma.truckSize.findFirst({
  //         where: { name: direction.truckSize },
  //       });
  //       return {
  //         documentType: direction.documentType || '',
  //         documentNumber: direction.documentNumber || '',
  //         // documentDate: new Date(),
  //         sla: direction.sla || '',
  //         // uploadedTime: new Date(),
  //         latitude: +direction.latitude,
  //         longitude: +direction.longitude,
  //         locationName: direction.locationName || '',
  //         phone: direction.phone || '',
  //         se: direction.se || '',
  //         homeNo: direction.homeNo || '',
  //         streetNo: direction.streetNo || '',
  //         village: direction.village || '',
  //         sangkat: direction.sangkat || '',
  //         khan: direction.khan || '',
  //         hotSpot: direction.hotSpot || '',
  //         direction: direction.direction || '',
  //         area: direction.area || '',
  //         region: direction.region || '',
  //         division: direction.division || '',
  //         zoneId: zone.id,
  //         truckSizeId: truckSize.id,
  //         deliveryDate: new Date('2023-11-15T10:23:45.678Z'),
  //         paymentTerm: direction.paymentTerm || '',
  //         // Vital500ml: +direction.Vital500ml || 0,
  //         // Meechiet: +direction.Meechiet || 0,
  //         comments: direction.comments || '',
  //         priority: direction.priority || 'LOW',
  //         partOfDay: direction.partOfDay || 'MORNING',
  //       };
  //     });

  //     // Map filteredData to include groupDirectionId
  //     const dataInsert = filteredData.map((drc) => ({
  //       ...drc,
  //       groupLocationId: groupLocation.id,
  //     }));

  //     // Insert multiple directions at once
  //     await this.prisma.location.createMany({
  //       data: dataInsert,
  //     });

  //     return {
  //       message: 'created successfully',
  //     };
  //   } catch (error) {
  //     console.error('Error during data insertion:', error);
  //     throw error;
  //   }
  // }
  async createDrc(file: any, id: number) {
    try {
      const result = this.fileUploadService.handleFileUpload(file);
      const jsonData = this.convertExcelToJson(result.path);

      // Validate each drc object
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

      const filteredDataPromises = jsonData.map(async (direction: any) => {
        const zone = await this.prisma.zone.findFirst({
          where: { code: direction.zone },
        });
        const truckSize = await this.prisma.truckSize.findFirst({
          where: { name: direction.truckSize },
        });
        if (!zone || !truckSize) {
          throw new NotFoundException();
        }
        // calculate capacity
        const Meechiet = await this.prisma.caseSize.findFirst({
          where: { name: 'Meechiet' },
        });
        const Vital500ml = await this.prisma.caseSize.findFirst({
          where: { name: 'Vital500ml' },
        });
        // console.log(Meechiet);
        if (!Meechiet || !Vital500ml) {
          throw new NotFoundException();
        }

        const totalCapacity =
          Meechiet.caseCubic * (direction.Meechiet * 1) +
          Vital500ml.caseCubic * (direction.Vital500ml * 1);
        return {
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
          zoneId: zone ? zone.id : null,
          truckSizeId: truckSize ? truckSize.id : null,
          deliveryDate: new Date('2023-11-15T10:23:45.678Z'),
          paymentTerm: direction.paymentTerm || '',
          comments: direction.comments || '',
          priority: direction.priority || 'LOW',
          partOfDay: direction.partOfDay || 'MORNING',
          capacity: totalCapacity,
        };
      });

      const filteredData = await Promise.all(filteredDataPromises);

      // Map filteredData to include groupDirectionId
      const dataInsert = filteredData.map((drc) => ({
        ...drc,
        deliveryRouteCalculationDateId: id,
      }));

      // Insert multiple directions at once
      await this.prisma.location.createMany({
        data: dataInsert,
      });

      return {
        message: 'created successfully',
      };
    } catch (error) {
      console.error('Error during data insertion:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    return 'hello ' + id;
  }
}
