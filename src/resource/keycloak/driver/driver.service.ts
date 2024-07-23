import { Injectable } from '@nestjs/common'; // Import Injectable decorator from NestJS
import { AccountStatus, KeycloakAccountRole } from '@prisma/client'; // Import enums from Prisma client
import { ResponseAllDto } from 'src/global/dto/response.all.dto'; // Import response DTO
import { PrismaService } from 'src/prisma/prisma.service'; // Import Prisma service for database operations

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {} // Inject PrismaService for database operations

  // Method to find all drivers based on query parameters
  async findAll(
    query: string,
    page: number,
    limit: number,
    status: AccountStatus,
  ): Promise<ResponseAllDto<any>> {
    const skip = (page - 1) * limit; // Calculate the number of items to skip for pagination
    const baseWhere = { Role: KeycloakAccountRole.ADMIN }; // Base condition to filter by driver role

    // Initialize the where clause with the base condition
    let where: any = {
      ...baseWhere,
    };

    // Add query conditions if query is provided
    if (query) {
      where = {
        ...where,
        OR: [
          { name: { contains: query, mode: 'insensitive' } }, // Case-insensitive search by name
          { email: { contains: query, mode: 'insensitive' } }, // Case-insensitive search by email
        ],
      };
    }

    // Add status condition if status is provided
    if (status) {
      where = {
        ...where,
        status, // Filter by status
      };
    }

    try {
      // Execute a transaction to fetch data and count simultaneously
      const [users, total] = await this.prisma.$transaction([
        // Fetch paginated list of drivers based on the where clause
        this.prisma.keycloakAccount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of drivers based on the where clause
        this.prisma.keycloakAccount.count({
          where,
        }),
      ]);

      // Return the paginated result
      return {
        data: users,
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
}
