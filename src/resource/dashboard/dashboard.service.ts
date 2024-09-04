import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SortType } from './enum/chart';

const generateRandomColor = () =>
  `#${Math.floor(Math.random() * 16777215).toString(16)}`;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}
  async findAll(start: string, end: string) {
    // Create a Date object for yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const whereClause =
      start && end
        ? {
            createdAt: {
              gte: new Date(start), // Greater than or equal to start date
              lte: new Date(end), // Less than or equal to end date
            },
          }
        : {};
    // Calculate total amount for the given period
    const res = await this.prisma.requirement.aggregate({
      _sum: {
        amount: true,
      },
      where: whereClause,
    });
    const totalAmount = res._sum.amount;

    // Fetch all case sizes
    const numberOfCase = await this.prisma.caseSize.findMany({
      select: { id: true, name: true },
    });

    const eachCaseInformation = [];
    for (const caseItem of numberOfCase) {
      // Calculate the sum of amounts for each case size in the given period
      const caseSum = await this.prisma.requirement.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          caseSizeId: caseItem.id,
          ...whereClause, // Apply the date filter if provided
        },
      });

      // Calculate the sum of amounts for each case size for yesterday
      const yesterdaySum = await this.prisma.requirement.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          caseSizeId: caseItem.id,
          createdAt: {
            gte: new Date(yesterday.toISOString().split('T')[0] + 'T00:00:00Z'), // Start of yesterday
            lte: new Date(yesterday.toISOString().split('T')[0] + 'T23:59:59Z'), // End of yesterday
          },
        },
      });
      // Calculate the sum of amounts for each case size for today
      const todaySum = await this.prisma.requirement.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          caseSizeId: caseItem.id,
          createdAt: {
            gte: new Date(today.toISOString().split('T')[0] + 'T00:00:00Z'), // Start of yesterday
            lte: new Date(today.toISOString().split('T')[0] + 'T23:59:59Z'), // End of yesterday
          },
        },
      });

      // Calculate growth rate
      const totalAmount = caseSum._sum.amount || 0;
      const yesterdayAmount = yesterdaySum._sum.amount || 0;
      const todayAmount = todaySum._sum.amount || 0;
      const growthRate =
        yesterdayAmount > 0
          ? ((todayAmount - yesterdayAmount) / yesterdayAmount) * 100
          : null;

      eachCaseInformation.push({
        caseSizeId: caseItem.id,
        caseSizeName: caseItem.name,
        totalAmount: totalAmount,
        growthRate: growthRate, // Add growth rate
      });
    }

    // Calculate overall growth rate for the total amount
    const yesterdayTotal = await this.prisma.requirement.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(yesterday.toISOString().split('T')[0] + 'T00:00:00Z'), // Start of yesterday
          lte: new Date(yesterday.toISOString().split('T')[0] + 'T23:59:59Z'), // End of yesterday
        },
      },
    });
    // Calculate the sum of amounts for each case size for today
    const todaySum = await this.prisma.requirement.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(today.toISOString().split('T')[0] + 'T00:00:00Z'), // Start of yesterday
          lte: new Date(today.toISOString().split('T')[0] + 'T23:59:59Z'), // End of yesterday
        },
      },
    });

    const yesterdayTotalAmount = yesterdayTotal._sum.amount || 0;
    const todayTotalAmount = todaySum._sum.amount || 0;
    const overallGrowthRate =
      yesterdayTotalAmount > 0
        ? ((todayTotalAmount - yesterdayTotalAmount) / yesterdayTotalAmount) *
          100
        : null;

    return {
      totalAmount: {
        amount: totalAmount,
        growthRate: overallGrowthRate,
      },
      eachCaseInformation,
    };
  }

  async getChartOne(sort: string) {
    try {
      if (!Object.values(SortType).includes(sort as SortType)) {
        throw new BadRequestException(
          'Invalid order parameter. Use month | year.',
        );
      }
      if (sort === 'month') {
        return await this.getMonthlyData();
      } else if (sort === 'year') {
        return await this.getYearlyData();
      } else {
        throw new Error('Invalid order parameter. Use month | year.');
      }
    } catch (error) {
      throw error;
    }
  }

  private async getMonthlyData() {
    const result = await this.prisma.requirement.groupBy({
      by: ['createdAt'],
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1), // Start of this year
          lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59), // End of the current year
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const series = [
      {
        name: 'Total sale',
        data: Array(12).fill(0),
      },
    ];
    const categories = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    result.forEach((item) => {
      const month = item.createdAt.getMonth(); // Get month index (0-11)
      series[0].data[month] += item._sum.amount || 0;
    });

    return { series, categories };
  }

  private async getYearlyData() {
    const result = await this.prisma.requirement.groupBy({
      by: ['createdAt'],
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: new Date(2000, 0, 1), // Example: Start from year 2000
          lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const series = [
      {
        name: 'Total sale',
        data: [],
      },
    ];
    const categories: string[] = [];

    result.forEach((item) => {
      const year = item.createdAt.getFullYear();
      const index = categories.indexOf(year.toString());

      if (index === -1) {
        categories.push(year.toString());
        series[0].data.push(item._sum.amount || 0);
      } else {
        series[0].data[index] += item._sum.amount || 0;
      }
    });

    return { series, categories };
  }

  async getChartThree(sort: string) {
    try {
      if (!Object.values(SortType).includes(sort as SortType)) {
        throw new BadRequestException(
          'Invalid sort parameter. Use "month" or "year".',
        );
      }
      if (sort === 'month') {
        return await this.chartThreeMonthly();
      } else if (sort === 'year') {
        return await this.chartThreeYearly();
      } else {
        throw new Error('Invalid order parameter. Use month | year.');
      }
    } catch (error) {
      throw error;
    }
  }

  private async chartThreeMonthly() {
    // Get all case sizes with names
    const caseSizes = await this.prisma.caseSize.findMany({
      select: { id: true, name: true },
    });

    // Extract caseIds from caseSizes
    const caseIds = caseSizes.map((item) => item.id);

    // Get summed requirements grouped by caseSizeId
    const requirements = await this.prisma.requirement.groupBy({
      by: ['caseSizeId'],
      where: {
        caseSizeId: {
          in: caseIds,
        },
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1), // Start of this year
          lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59), // End of the year
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Create a map of caseId to name for easy lookup
    const caseSizeMap = new Map(caseSizes.map(({ id, name }) => [id, name]));

    // Combine requirements with case size names and add random colors
    const response = requirements.map((req) => {
      const name = caseSizeMap.get(req.caseSizeId) || 'Unknown';
      return {
        caseSizeId: req.caseSizeId,
        name: name,
        amount: req._sum.amount,
        color: generateRandomColor(), // Add random color code
      };
    });

    // Return the formatted result
    return response;
  }

  private async chartThreeYearly() {
    // Get all case sizes with names
    const caseSizes = await this.prisma.caseSize.findMany({
      select: { id: true, name: true },
    });

    // Extract caseIds from caseSizes
    const caseIds = caseSizes.map((item) => item.id);

    // Get summed requirements grouped by caseSizeId
    const requirements = await this.prisma.requirement.groupBy({
      by: ['caseSizeId'],
      where: {
        caseSizeId: {
          in: caseIds,
        },
        createdAt: {
          gte: new Date(2000, 0, 1), // Example: Start from year 2000
          lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59),
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Create a map of caseId to name for easy lookup
    const caseSizeMap = new Map(caseSizes.map(({ id, name }) => [id, name]));

    // Combine requirements with case size names and add random colors
    const response = requirements.map((req) => {
      const name = caseSizeMap.get(req.caseSizeId) || 'Unknown';
      return {
        caseSizeId: req.caseSizeId,
        name: name,
        amount: req._sum.amount,
        color: generateRandomColor(), // Add random color code
      };
    });

    // Return the formatted result
    return response;
  }

  private getDaysInMonth(date: Date): number[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  async getChartTwo() {
    const now = new Date();
    const days = this.getDaysInMonth(now);
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth() + 1;

    const results = await Promise.all(
      days.map(async (day) => {
        // Construct the start and end of the day
        const startDate = new Date(
          `${currentYear}-${String(currentMonthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`,
        );
        const endDate = new Date(
          `${currentYear}-${String(currentMonthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999Z`,
        );

        // Fetch requirements created on the specified day
        const requirements = await this.prisma.requirement.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
          select: {
            amount: true,
          },
        });

        // Sum the amounts
        return requirements.reduce((sum, req) => sum + req.amount, 0);
      }),
    );

    return {
      days: days,
      totalAmounts: results,
    };
  }
  async getChartSix(sort: string) {
    try {
      if (!Object.values(SortType).includes(sort as SortType)) {
        throw new BadRequestException(
          'Invalid order parameter. Use month | year.',
        );
      }
      if (sort === 'month') {
        return await this.getMonthlyDataSix();
      } else if (sort === 'year') {
        return await this.getYearlyDataSix();
      } else {
        throw new Error('Invalid order parameter. Use month | year.');
      }
    } catch (error) {
      throw error;
    }
  }

  private async getMonthlyDataSix() {
    // Get all caseSizeId
    const resCaseSizeId = await this.prisma.caseSize.findMany({
      select: { id: true, name: true },
    });

    // Initialize the response
    const response = [];
    const colors = [];

    // Loop through each caseSizeId
    for (const caseSize of resCaseSizeId) {
      // Fetch the grouped data for each caseSizeId
      const result = await this.prisma.requirement.groupBy({
        by: ['createdAt'],
        _sum: {
          amount: true,
        },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1), // Start of this year
            lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59), // End of the current year
          },
          caseSizeId: caseSize.id, // Filter by caseSizeId
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Initialize the series
      const series = {
        name: caseSize.name,
        data: Array(12).fill(0), // Initialize with zeros for each month
      };

      // Process the data
      result.forEach((item) => {
        const date = new Date(item.createdAt);
        const month = date.getMonth(); // Get the month index (0-11)
        series.data[month] += item._sum.amount; // Accumulate the amount for the month
      });

      // Process the result and add to the response
      response.push(series);
      colors.push(generateRandomColor());
    }
    const categories = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return { series: response, categories, colors };
  }

  private async getYearlyDataSix() {
    // Get all caseSizeId
    const resCaseSizeId = await this.prisma.caseSize.findMany({
      select: { id: true, name: true },
    });

    // Initialize the response
    const response = [];
    const colors = [];

    // Loop through each caseSizeId
    for (const caseSize of resCaseSizeId) {
      // Fetch the grouped data for each caseSizeId
      const result = await this.prisma.requirement.groupBy({
        by: ['createdAt'],
        _sum: {
          amount: true,
        },
        where: {
          createdAt: {
            gte: new Date(2000, 0, 1), // Example: Start from year 2000
            lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59), // End of the current year
          },
          caseSizeId: caseSize.id, // Filter by caseSizeId
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Initialize the series
      const series = {
        name: caseSize.name,
        data: [], // Initialize empty array for yearly data
      };

      // Initialize a map to keep track of yearly sums
      const yearlyDataMap: { [key: string]: number } = {};

      // Process the data
      result.forEach((item) => {
        const year = new Date(item.createdAt).getFullYear();
        yearlyDataMap[year] = (yearlyDataMap[year] || 0) + item._sum.amount; // Accumulate the amount for the year
      });

      // Populate the series data array in the correct order of years
      const startYear = 2000;
      const currentYear = new Date().getFullYear();

      for (let year = startYear; year <= currentYear; year++) {
        series.data.push(yearlyDataMap[year] || 0);
      }

      // Add the series and color to the response
      response.push(series);
      colors.push(generateRandomColor());
    }

    // Generate categories (years from 2000 to current year)
    const categories = Array.from(
      { length: new Date().getFullYear() - 2000 + 1 },
      (_, i) => (2000 + i).toString(),
    );

    return { series: response, categories, colors };
  }
}
