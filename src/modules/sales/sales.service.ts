import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { veterinaryId?: string; fromDate?: string; toDate?: string }) {
    const where: any = { state: 'confirmed' };
    if (query.veterinaryId) where.veterinaryId = parseInt(query.veterinaryId);
    if (query.fromDate || query.toDate) {
      where.dateOrder = {};
      if (query.fromDate) where.dateOrder.gte = new Date(query.fromDate);
      if (query.toDate) where.dateOrder.lte = new Date(query.toDate);
    }

    const carts = await this.prisma.cart.findMany({
      where,
      include: {
        lines: {
          include: { product: { select: { name: true } } },
        },
        partner: { select: { name: true } },
      },
      orderBy: { dateOrder: 'desc' },
    });

    return carts.map((c) => ({
      id: c.id,
      veterinaryId: c.veterinaryId,
      customerName: c.partner.name,
      createdAt: c.dateOrder.toISOString(),
      status: c.state,
      total: c.lines.reduce((sum, l) => sum + (l.subtotal || 0), 0),
      items: c.lines.map((l) => ({
        productId: l.productId,
        productName: l.productName || l.product.name,
        quantity: l.quantity,
        unitPrice: l.priceUnit || 0,
        totalPrice: l.subtotal || 0,
      })),
    }));
  }
}
