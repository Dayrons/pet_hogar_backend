import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Injectable()
export class VeterinariesService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async findAll(query: { type?: string; city?: string; isEmergency?: string }) {
    const where: any = { isActive: true };
    if (query.type) where.type = query.type;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.isEmergency === 'true') where.isEmergency = true;

    const vets = await this.prisma.veterinary.findMany({
      where,
      include: { _count: { select: { pets: true, adoptions: true } } },
    });

    return vets.map((v) => ({
      id: v.id,
      name: v.name,
      tagline: v.tagline || '',
      latitude: v.latitude,
      longitude: v.longitude,
      address: v.address || '',
      phone: v.phone || '',
      email: v.email || '',
      photoUrl: this.fileUpload.getFullUrl(v.logo) || '',
      coverUrl: this.fileUpload.getFullUrl(v.coverImage) || '',
      rating: v.rating,
      distanceKm: 0,
      type: v.type,
      isEmergency: v.isEmergency,
      isOpen: v.isOpen,
      totalPets: v._count.pets,
      adoptedPets: v._count.adoptions,
    }));
  }

  async findOne(id: number) {
    const v = await this.prisma.veterinary.findUnique({
      where: { id },
      include: {
        services: true,
        schedules: true,
        socialLinks: true,
        _count: { select: { pets: true, adoptions: true, products: true } },
      },
    });
    if (!v) throw new NotFoundException('Veterinary not found');

    const scheduleMap: Record<string, any> = {};
    for (const s of v.schedules) {
      scheduleMap[s.dayOfWeek] = { open: s.openTime, close: s.closeTime, isClosed: s.isClosed };
    }

    return {
      id: v.id,
      name: v.name,
      tagline: v.tagline,
      coverUrl: this.fileUpload.getFullUrl(v.coverImage) || '',
      avatarUrl: this.fileUpload.getFullUrl(v.logo) || '',
      description: v.notes,
      address: v.address,
      phone: v.phone,
      email: v.email,
      latitude: v.latitude,
      longitude: v.longitude,
      rating: v.rating,
      totalPets: v._count.pets,
      adoptedPets: v._count.adoptions,
      totalProducts: v._count.products,
      type: v.type,
      isEmergency: v.isEmergency,
      isHospital: v.isHospital,
      isOpen: v.isOpen,
      services: v.services.map((s) => s.name),
      schedule: scheduleMap,
      socialLinks: v.socialLinks.map((l) => l.url),
    };
  }

  async getRaw(id: number) {
    return this.prisma.veterinary.findUnique({ where: { id } });
  }

  async create(data: any, userId: number) {
    const vet = await this.prisma.veterinary.create({
      data: {
        name: data.name,
        tagline: data.tagline,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        taxId: data.taxId,
        licenseNumber: data.licenseNumber,
        latitude: data.latitude,
        longitude: data.longitude,
        type: data.type || 'clinic',
        isEmergency: data.isEmergency || false,
        isHospital: data.isHospital || false,
        isOpen: data.isOpen !== undefined ? data.isOpen : true,
        notes: data.description,
        staffUserId: userId,
      },
    });

    await this.prisma.veterinaryUser.create({
      data: {
        userId,
        veterinaryId: vet.id,
        role: 'VET_ADMIN',
      },
    });

    return { success: true, id: vet.id, name: vet.name };
  }

  async getField(id: number, field: string): Promise<string | null> {
    const vet = await this.prisma.veterinary.findUnique({ where: { id }, select: { [field]: true } });
    const val = vet?.[field as keyof typeof vet];
    return typeof val === 'string' ? val : null;
  }

  async update(id: number, data: any) {
    const vet = await this.prisma.veterinary.findUnique({ where: { id } });
    if (!vet) throw new NotFoundException('Veterinary not found');

    const updateData: any = {};
    const fields = ['name', 'tagline', 'phone', 'email', 'website', 'address', 'city', 'state',
      'country', 'taxId', 'licenseNumber', 'latitude', 'longitude', 'type', 'isEmergency',
      'isHospital', 'isOpen', 'isActive', 'rating', 'logo', 'coverImage'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.description !== undefined) updateData.notes = data.description;

    await this.prisma.veterinary.update({ where: { id }, data: updateData });
    return { success: true };
  }

  async remove(id: number) {
    await this.prisma.veterinary.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  async updateCoordinates(id: number, latitude?: number, longitude?: number) {
    const data: any = {};
    if (latitude !== undefined) data.latitude = latitude;
    if (longitude !== undefined) data.longitude = longitude;
    const updated = await this.prisma.veterinary.update({ where: { id }, data });
    return { success: true, latitude: updated.latitude, longitude: updated.longitude };
  }

  async getServices(id: number) {
    return this.prisma.service.findMany({ where: { veterinaryId: id } });
  }

  async createService(id: number, name: string) {
    const service = await this.prisma.service.create({ data: { name, veterinaryId: id } });
    return { success: true, id: service.id };
  }

  async getSchedule(id: number) {
    return this.prisma.schedule.findMany({ where: { veterinaryId: id } });
  }

  async updateSchedule(id: number, schedule: any[]) {
    await this.prisma.schedule.deleteMany({ where: { veterinaryId: id } });
    for (const s of schedule) {
      await this.prisma.schedule.create({
        data: {
          veterinaryId: id,
          dayOfWeek: s.dayOfWeek,
          openTime: s.open,
          closeTime: s.close,
          isClosed: s.isClosed || false,
        },
      });
    }
    return { success: true };
  }

  async getSocialLinks(id: number) {
    return this.prisma.socialLink.findMany({ where: { veterinaryId: id } });
  }

  async createSocialLink(id: number, data: { name: string; url: string }) {
    const link = await this.prisma.socialLink.create({ data: { ...data, veterinaryId: id } });
    return { success: true, id: link.id };
  }

  async getClients(id: number) {
    return this.prisma.partner.findMany({
      where: { veterinaryId: id },
      select: { id: true, name: true, email: true, phone: true, address: true, city: true },
    });
  }

  async getNearby(lat: number, lng: number, radius: number) {
    const vets = await this.prisma.veterinary.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
    });

    return vets
      .map((v) => {
        const distance = this.haversine(lat, lng, v.latitude!, v.longitude!);
        return { ...v, distanceKm: Math.round(distance * 10) / 10 };
      })
      .filter((v) => v.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
