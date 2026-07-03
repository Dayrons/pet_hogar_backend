import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async findAll(query: { status?: string; veterinaryId?: string; petId?: string; fromDate?: string; toDate?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.veterinaryId) where.veterinaryId = parseInt(query.veterinaryId);
    if (query.petId) where.petId = parseInt(query.petId);
    if (query.fromDate) where.appointmentDate = { gte: new Date(query.fromDate) };
    if (query.toDate) where.appointmentDate = { ...where.appointmentDate, lte: new Date(query.toDate) };

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        pet: { select: { name: true, images: { take: 1, orderBy: { sequence: 'asc' } }, owner: { select: { name: true, phone: true } } } },
      },
      orderBy: { appointmentDate: 'asc' },
    });

    return appointments.map((a) => ({
      id: a.id,
      petId: a.petId,
      petName: a.pet.name,
      petPhoto: this.fileUpload.getFullUrl(a.pet.images[0]?.imageUrl) || '',
      ownerName: a.pet.owner?.name || '',
      ownerPhone: a.pet.owner?.phone || '',
      veterinaryId: a.veterinaryId,
      veterinarianName: '',
      scheduledAt: a.appointmentDate.toISOString(),
      durationMinutes: Math.round(a.duration * 60),
      type: a.visitType,
      status: a.status,
      reason: a.reason || '',
      notes: a.notes || '',
      reminderSent: false,
    }));
  }

  async create(data: any) {
    const appointment = await this.prisma.appointment.create({
      data: {
        petId: parseInt(data.petId),
        veterinaryId: parseInt(data.veterinaryId),
        specialistId: data.specialistId ? parseInt(data.specialistId) : null,
        appointmentDate: new Date(data.scheduledAt),
        duration: data.durationMinutes ? data.durationMinutes / 60 : 1.0,
        visitType: data.reason ? 'checkup' : 'checkup',
        reason: data.reason,
        notes: data.notes,
      },
    });
    return { success: true, id: appointment.id };
  }

  async update(id: number, data: any) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.reason !== undefined) updateData.reason = data.reason;
    if (data.scheduledAt) updateData.appointmentDate = new Date(data.scheduledAt);
    if (data.durationMinutes) updateData.duration = data.durationMinutes / 60;
    if (data.specialistId) updateData.specialistId = parseInt(data.specialistId);

    await this.prisma.appointment.update({ where: { id }, data: updateData });
    return { success: true };
  }

  async remove(id: number) {
    await this.prisma.appointment.delete({ where: { id } });
    return { success: true };
  }
}
