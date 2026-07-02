import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdoptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string; veterinaryId?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.veterinaryId) where.veterinaryId = parseInt(query.veterinaryId);

    const adoptions = await this.prisma.adoption.findMany({
      where,
      include: {
        pet: { select: { name: true } },
        adopter: { select: { name: true } },
      },
      orderBy: { requestDate: 'desc' },
    });

    return adoptions.map((a) => ({
      id: a.id,
      petId: a.petId,
      petName: a.pet.name,
      adopterId: a.adopterId,
      adopterName: a.adopter.name,
      veterinaryId: a.veterinaryId,
      requestDate: a.requestDate.toISOString(),
      approvedDate: a.approvedDate?.toISOString() || null,
      status: a.status,
      adoptionFee: a.adoptionFee,
      notes: a.notes || '',
    }));
  }

  async create(data: any) {
    const adoption = await this.prisma.adoption.create({
      data: {
        petId: parseInt(data.petId),
        adopterId: parseInt(data.adopterId),
        veterinaryId: parseInt(data.veterinaryId),
        notes: data.notes,
      },
    });

    await this.prisma.pet.update({
      where: { id: parseInt(data.petId) },
      data: {
        status: 'adopted',
        adoptedAt: new Date(),
        ownerId: parseInt(data.adopterId),
      },
    });

    return { success: true, id: adoption.id };
  }

  async update(id: number, data: any) {
    const adoption = await this.prisma.adoption.findUnique({ where: { id } });
    if (!adoption) throw new NotFoundException('Adoption not found');

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.adoptionFee !== undefined) updateData.adoptionFee = data.adoptionFee;
    if (data.homeCheckDone !== undefined) updateData.homeCheckDone = data.homeCheckDone;
    if (data.signedContract !== undefined) updateData.signedContract = data.signedContract;
    if (data.approvedDate) updateData.approvedDate = new Date(data.approvedDate);

    await this.prisma.adoption.update({ where: { id }, data: updateData });
    return { success: true };
  }

  async remove(id: number) {
    await this.prisma.adoption.delete({ where: { id } });
    return { success: true };
  }
}
