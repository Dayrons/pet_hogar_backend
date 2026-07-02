import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(veterinaryId: number) {
    const [totalPets, availablePets, todayAppointments, pendingAdoptions, totalProducts, lowStockProducts] = await Promise.all([
      this.prisma.pet.count({ where: { veterinaryId } }),
      this.prisma.pet.count({ where: { veterinaryId, status: 'available', petType: 'adoption' } }),
      this.prisma.appointment.count({
        where: {
          veterinaryId,
          appointmentDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) },
        },
      }),
      this.prisma.adoption.count({ where: { veterinaryId, status: 'pending' } }),
      this.prisma.product.count({ where: { veterinaryId, isActive: true } }),
      this.prisma.product.count({ where: { veterinaryId, isActive: true, stock: { lte: 0 } } }),
    ]);

    return {
      totalPets,
      availablePets,
      todayAppointments,
      pendingAdoptions,
      totalProducts,
      lowStockProducts,
      todayRevenue: 0,
      monthRevenue: 0,
    };
  }
}
