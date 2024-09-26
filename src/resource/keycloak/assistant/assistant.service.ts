import { Injectable } from '@nestjs/common';
import { AccountStatus, KeycloakAccountRole } from '@prisma/client';
import { ResponseAllDto } from 'src/global/dto/response.all.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AssistantService {
  constructor(private readonly prisma: PrismaService) {} // Inject PrismaService for database operations

  // Method to find all assistants based on query parameters
  async findAll(
    query: string,
    page: number,
    limit: number,
    status: AccountStatus,
  ): Promise<ResponseAllDto<any>> {
    const skip = (page - 1) * limit; // Calculate the number of items to skip for pagination
    const baseWhere = { Role: KeycloakAccountRole.ASSISTANT }; // Base condition to filter by assistant role

    // Initialize the where clause with the base condition
    let where: any = {
      ...baseWhere,
    };

    // Add query conditions if query is provided
    if (query) {
      where = {
        ...where,
        OR: [
          { name: { contains: query.toLowerCase() } },
          { email: { contains: query.toLowerCase() } },
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
        // Fetch paginated list of assistants based on the where clause
        this.prisma.keycloakAccount.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'desc' }, // Order by ID in descending order
        }),
        // Fetch the total count of assistants based on the where clause
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
