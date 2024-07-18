import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseCreateOrUpdateDTO } from 'src/global/dto/response.create.update.dto';

@Injectable()
export class CaseService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    createCaseDto: CreateCaseDto,
  ): Promise<ResponseCreateOrUpdateDTO> {
    try {
      // Destructure necessary properties from the DTO
      const { name, caseLenght, caseWeight, caseHeight } = createCaseDto;

      // Calculate the cubic capacity of the case
      const caseCubic = caseLenght * caseWeight * caseHeight;

      // Create a new truck size entry in the database
      const newCase = await this.prisma.caseSize.create({
        data: {
          name,
          caseLenght,
          caseWeight,
          caseHeight,
          caseCubic,
        },
      });

      // Return success response
      return {
        data: newCase,
        message: 'Created successfully',
        statusCode: HttpStatus.CREATED,
      };
    } catch (error) {
      // Check for duplicate name error
      if (error.code === 'P2002') {
        throw new ConflictException('Name already exists!');
      } else {
        throw error;
      }
    }
  }

  async findAll(page: number, limit: number) {
    return `This action returns all case`;
  }

  findOne(id: number) {
    return `This action returns a #${id} case`;
  }

  update(id: number, updateCaseDto: UpdateCaseDto) {
    return `This action updates a #${id} case`;
  }

  remove(id: number) {
    return `This action removes a #${id} case`;
  }
}
