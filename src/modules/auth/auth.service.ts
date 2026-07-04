import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { v4 as uuidv4 } from 'uuid';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private fileUpload: FileUploadService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateAuthResponse(user);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const role = dto.role === 'vet_admin' ? 'VET_ADMIN' : 'ADOPTER';

    const user = await this.prisma.user.create({
      data: {
        uuid: uuidv4(),
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role,
      },
    });

    await this.prisma.partner.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        userId: user.id,
      },
    });

    return this.generateAuthResponse(user);
  }

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
    if (!user) return null;
    return {
      ...user,
      role: user.role.toLowerCase(),
      photoUrl: this.fileUpload.getFullUrl(user.photoUrl),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isOldPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isOldPasswordValid) throw new UnauthorizedException('Current password is incorrect');

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  private async generateAuthResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    const veterinary = user.veterinaryId
      ? await this.prisma.veterinary.findUnique({ where: { id: user.veterinaryId } })
      : null;

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        photoUrl: this.fileUpload.getFullUrl(user.photoUrl) || '',
        role: user.role.toLowerCase(),
        veterinaryId: user.veterinaryId || null,
        veterinaryName: veterinary?.name || '',
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}
