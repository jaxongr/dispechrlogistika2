import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Payments')
@Public()
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all payments' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { telegramId: true, firstName: true, username: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Payment statistics' })
  async getStats() {
    const [total, completed, totalRevenue] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      total,
      completed,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }
}
