import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SpecialistsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { veterinaryId?: string; search?: string }) {
    const where: any = {};
    if (query.veterinaryId) where.veterinaryId = parseInt(query.veterinaryId);
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const specialists = await this.prisma.specialist.findMany({
      where,
      include: { specialties: { include: { specialty: true } } },
    });

    return specialists.map((s) => ({
      id: s.id,
      name: s.name,
      specialty: s.specialties.map((ss) => ss.specialty.name),
      phone: s.phone || '',
      email: s.email || '',
      licenseNumber: s.licenseNumber || '',
      veterinaryId: s.veterinaryId,
    }));
  }

  async syncFromOdoo(payload: any, action: string): Promise<void> {
    let existing = payload.uuid
      ? await this.prisma.specialist.findFirst({ where: { uuid: payload.uuid } })
      : null;
    if (!existing) {
      existing = await this.prisma.specialist.findFirst({
        where: { name: payload.name, veterinaryId: payload.veterinary_id },
      });
    }

    let vet = payload.veterinary_uuid
      ? await this.prisma.veterinary.findFirst({ where: { uuid: payload.veterinary_uuid } })
      : null;
    if (!vet && payload.veterinary_id) {
      vet = await this.prisma.veterinary.findFirst({ where: { odooVeterinaryId: payload.veterinary_id } });
    }
    if (!vet) {
      return;
    }

    const data: any = {
      uuid: payload.uuid || uuidv4(),
      name: payload.name,
      phone: payload.phone || '',
      email: payload.email || '',
      licenseNumber: payload.license_number || '',
      veterinaryId: vet.id,
    };

    if (action === 'create' && !existing) {
      await this.prisma.specialist.create({ data });
    } else if (action === 'update' && existing) {
      await this.prisma.specialist.update({ where: { id: existing.id }, data });
    }
  }

  async create(data: any) {
    const specialist = await this.prisma.specialist.create({
      data: {
        uuid: uuidv4(),
        name: data.name,
        phone: data.phone,
        email: data.email,
        licenseNumber: data.licenseNumber,
        veterinaryId: parseInt(data.veterinaryId),
        specialties: data.specialtyIds?.length
          ? { create: data.specialtyIds.map((id: number) => ({ specialtyId: id })) }
          : undefined,
      },
    });
    return { success: true, id: specialist.id };
  }

  async update(id: number, data: any) {
    const specialist = await this.prisma.specialist.findUnique({ where: { id } });
    if (!specialist) throw new NotFoundException('Specialist not found');

    await this.prisma.specialist.update({ where: { id }, data: { name: data.name, phone: data.phone, email: data.email, licenseNumber: data.licenseNumber } });
    return { success: true };
  }

  async remove(id: number) {
    await this.prisma.specialist.delete({ where: { id } });
    return { success: true };
  }
}
