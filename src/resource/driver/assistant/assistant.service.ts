import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/global/enum/role.enum';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';
import { DriverStatus } from 'src/resource/enums/driver-status.enum';

@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new assistant
  async create(
    createAssistantDto: CreateAssistantDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const { name, email, password, gender, phone, age } = createAssistantDto;
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a new assistant user in the database
      const assistant = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId: Role.assistant,
          gender: gender,
          Assistant: {
            create: {
              phone: phone,
              age: age,
            },
          },
        },
      });
      delete assistant.password; // Remove sensitive data from the response
      return {
        data: assistant,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error; // Re-throw any other errors
    }
  }

  // Find all assistants based on query parameters
  async findAll(
    query: string,
    page: number,
    limit: number,
    status: DriverStatus,
  ): Promise<ResponseAllDto<any>> {
    const skip = (page - 1) * limit;
    const baseWhere = { roleId: Role.assistant };

    let where: any = {
      ...baseWhere,
    };

    if (query) {
      where = {
        ...where,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };
    }

    if (status) {
      where = {
        ...where,
        Assistant: {
          status: status,
        },
      };
    }

    try {
      const [users, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({
          where,
          include: {
            Assistant: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({
          where,
        }),
      ]);

      return {
        data: users,
        totalCount: total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      };
    } catch (error) {
      // Handle any database errors
      throw new Error(`Failed to fetch assistants: ${error.message}`);
    }
  }

  // Find a specific assistant by ID
  async findOne(id: number) {
    try {
      const isAssistant = await this.prisma.user.findUnique({
        where: { id, roleId: Role.assistant },
        include: {
          Assistant: true,
        },
      });
      if (!isAssistant) {
        throw new NotFoundException(); // Throw a 404 error if assistant not found
      }
      delete isAssistant.password; // Remove sensitive data from the response
      return isAssistant;
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }

  // Update an existing assistant
  async update(
    id: number,
    updateAssistantDto: UpdateAssistantDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      const isUser = await this.findOne(id); // Check if assistant exists
      const { name, email, gender, phone, age, status } = updateAssistantDto;

      // Update assistant details in the database
      const assistant = await this.prisma.user.update({
        where: {
          id: isUser.id,
        },
        data: {
          name,
          email,
          gender,
          Assistant: {
            upsert: {
              create: {
                phone: phone,
                age: age,
                status: status,
              },
              update: {
                phone: phone,
                age: age,
                status: status,
              },
            },
          },
        },
        include: {
          Assistant: true,
        },
      });

      delete assistant.password; // Remove sensitive data from the response
      return {
        data: assistant,
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      // Handle unique constraint violation (email already exists)
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error; // Re-throw any other errors
    }
  }

  // Remove an assistant
  async remove(id: number) {
    try {
      const isAssistant = await this.findOne(id); // Check if assistant exists
      await this.prisma.user.delete({ where: { id: isAssistant.id } }); // Delete assistant from the database
      return {
        message: 'Deleted successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }

  // Toggle active assistant account
  async toggle(id: number) {
    try {
      const isAssistant = await this.findOne(id); // Check if assistant exists
      let active: boolean;
      isAssistant.status ? (active = false) : (active = true);
      await this.prisma.user.update({
        where: { id: isAssistant.id },
        data: { status: active },
      }); // Delete assistant from the database
      return {
        message: 'Updated successfully',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      throw error; // Re-throw any errors
    }
  }
}
