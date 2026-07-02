import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';

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

  async getField(id: number, field: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { [field]: true } });
    const val = user?.[field as keyof typeof user];
    return typeof val === 'string' ? val : null;
  }
}
