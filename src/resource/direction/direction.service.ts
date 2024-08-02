import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDirectionDto } from './dto/create-direction.dto';
import * as XLSX from 'xlsx';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileUploadService } from 'src/file/file-upload.service';
import { v4 as uuidv4 } from 'uuid';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEachDirectionDto } from './dto/create-each-direction.dto';

@Injectable()
export class DirectionService {
  constructor(
    private prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  convertExcelToJson(filePath: string): any {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    return jsonData;
  }

  groupByRoute(data: any) {
    const grouped = data.reduce((acc, item) => {
      const key = item.route;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    // Convert grouped object to an array
    return Object.keys(grouped).map((route) => ({
      route,
      directions: grouped[route],
    }));
  }

  async create(createDirectionDto: CreateDirectionDto, file: any) {
    const prisma = this.prisma;

    try {
      const result = this.fileUploadService.handleFileUpload(file);
      const jsonData = this.convertExcelToJson(result.path);

      // Validate each direction object
      for (const direction of jsonData) {
        const directionDto = plainToClass(CreateEachDirectionDto, direction);
        const errors = await validate(directionDto);

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

      // Filter each direction object
      const filteredData: CreateEachDirectionDto[] = jsonData.map(
        (direction: CreateEachDirectionDto) => {
          return {
            route: direction.route,
            lat: +direction.lat,
            long: +direction.long,
            name: direction.name,
            status: direction.status || '',
            type: direction.type || '',
          };
        },
      );

      return await prisma.$transaction(async (tx) => {
        // Create the group direction first
        const groupDirection = await tx.groupDirection.create({
          data: {
            group: uuidv4(),
            note: createDirectionDto.note,
          },
        });

        // Map filteredData to include groupDirectionId
        const directionsData = filteredData.map((direction) => ({
          ...direction,
          groupDirectionId: groupDirection.id,
        }));

        // Insert multiple directions at once
        await tx.direction.createMany({
          data: directionsData,
        });

        return {
          data: directionsData,
          message: 'Directions created successfully',
          statusCode: HttpStatus.CREATED,
        };
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit; // Calculate the number of items to skip for pagination

    // Initialize the where clause for filtering
    let where: any = {};

    // Add query conditions if a search query is provided
    if (query) {
      where = {
        OR: [
          { note: { contains: query, mode: 'insensitive' } }, // Search by name
          { group: { contains: query, mode: 'insensitive' } }, // Search by name
        ],
      };
    }
    try {
      // Execute a transaction to fetch paginated data and count simultaneously
      const [groupDirectionData, total] = await this.prisma.$transaction([
        // Fetch paginated list of groupDirectionData based on the where clause
        this.prisma.groupDirection.findMany({
          where,
          skip,
          take: limit,
          include: {
            Direction: true,
          },
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of groupDirectionData based on the where clause
        this.prisma.groupDirection.count({
          where,
        }),
      ]);

      const result = groupDirectionData.map((groupDirection) => {
        const totalDirections = groupDirection.Direction.length;
        const totalRoutes = new Set(
          groupDirection.Direction.map((dir) => dir.route),
        ).size;

        return {
          id: groupDirection.id,
          group: groupDirection.group,
          note: groupDirection.note,
          createdAt: groupDirection.createdAt,
          totalDirections,
          totalRoutes,
        };
      });

      // Return the paginated result
      return {
        data: result,
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

  async findOne(groupDirectionId: number) {
    const isGroupDirId = await this.prisma.groupDirection.findUnique({
      where: { id: groupDirectionId },
    });
    if (!isGroupDirId) {
      throw new NotFoundException();
    }
    const directions = await this.prisma.direction.findMany({
      where: {
        groupDirectionId,
      },
    });
    return this.groupByRoute(directions);
  }

  async remove(groupDirectionId: number) {
    const isGroupDirId = await this.prisma.groupDirection.findUnique({
      where: { id: groupDirectionId },
    });
    if (!isGroupDirId) {
      throw new NotFoundException();
    }
    await this.prisma.groupDirection.delete({
      where: { id: groupDirectionId },
    });
    return {
      message: 'Deleted successfully',
      statusCode: HttpStatus.OK,
    };
  }
}
