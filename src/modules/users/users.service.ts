import crypto from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        photoUrl: true,
        role: true,
        veterinaryId: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { ...user, photoUrl: this.fileUpload.getFullUrl(user.photoUrl) };
  }

  async updateProfile(userId: number, data: any) {
    await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return { success: true };
  }

  async syncFromOdoo(payload: any, action: string): Promise<void> {
    let existing = payload.uuid
      ? await this.prisma.user.findFirst({ where: { uuid: payload.uuid } })
      : null;
    if (!existing && payload.id) {
      existing = await this.prisma.user.findFirst({ where: { odooUserId: payload.id } });
    }

    const data: any = {
      uuid: payload.uuid || uuidv4(),
      odooUserId: payload.id,
      name: payload.name,
      email: payload.email,
      password: crypto.randomUUID() + '_odoo_sync',
      phone: payload.phone || '',
      role: (payload.role || 'adopter').toUpperCase() as any,
    };

    const photoUrl = await this.fileUpload.saveBase64('users', payload.photo_data);
    if (photoUrl) {
      data.photoUrl = photoUrl;
    } else if (!existing?.photoUrl) {
      data.photoUrl = null;
    }

    if (action === 'create' && !existing) {
      await this.prisma.user.create({ data });
    } else if (action === 'update' && existing) {
      await this.prisma.user.update({ where: { id: existing.id }, data });
    }
  }

  async getField(id: number, field: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { [field]: true } });
    const val = user?.[field as keyof typeof user];
    return typeof val === 'string' ? val : null;
  }
}
