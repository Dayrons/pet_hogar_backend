import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MedicalRecordsService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const r = await this.prisma.medicalRecord.findUnique({
      where: { id },
      include: {
        attachments: true,
        pet: { select: { name: true } },
      },
    });
    if (!r) throw new NotFoundException('Medical record not found');

    return {
      id: r.id,
      petId: r.petId,
      petName: r.pet.name,
      veterinaryId: r.veterinaryId,
      veterinarianName: r.veterinarianName,
      visitDate: r.visitDate.toISOString(),
      visitType: r.visitType,
      subjective: r.subjective || '',
      objective: r.objective || '',
      assessment: r.assessment || '',
      plan: r.plan || '',
      temperature: r.temperature,
      heartRate: r.heartRate,
      respiratoryRate: r.respiratoryRate,
      weight: r.weight,
      bodyCondition: r.bodyCondition,
      diagnosis: r.diagnosis,
      procedures: r.procedures,
      notes: r.notes || '',
      followUpDate: r.followUpDate?.toISOString() || null,
      attachments: r.attachments,
    };
  }

  async create(data: any) {
    const record = await this.prisma.medicalRecord.create({
      data: {
        petId: parseInt(data.petId),
        veterinaryId: parseInt(data.veterinaryId),
        veterinarianName: data.veterinarianName || '',
        visitDate: data.visitDate ? new Date(data.visitDate) : undefined,
        visitType: data.visitType || 'checkup',
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        temperature: data.temperature,
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        weight: data.weight,
        bodyCondition: data.bodyCondition,
        diagnosis: data.diagnosis || [],
        procedures: data.procedures || [],
        notes: data.notes,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
      },
    });
    return { success: true, id: record.id };
  }

  async update(id: number, data: any) {
    const record = await this.prisma.medicalRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Medical record not found');

    const updateData: any = {};
    const fields = ['veterinarianName', 'visitType', 'subjective', 'objective', 'assessment',
      'plan', 'temperature', 'heartRate', 'respiratoryRate', 'weight', 'bodyCondition', 'notes',
      'diagnosis', 'procedures'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.visitDate !== undefined) updateData.visitDate = new Date(data.visitDate);
    if (data.followUpDate !== undefined) updateData.followUpDate = data.followUpDate ? new Date(data.followUpDate) : null;

    await this.prisma.medicalRecord.update({ where: { id }, data: updateData });
    return { success: true };
  }

  async remove(id: number) {
    await this.prisma.medicalRecord.delete({ where: { id } });
    return { success: true };
  }
}
