import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Injectable()
export class PetsService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async findAll(query: { status?: string; veterinaryId?: string; species?: string; search?: string }) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.veterinaryId) where.veterinaryId = parseInt(query.veterinaryId);
    if (query.species) where.species = query.species;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const pets = await this.prisma.pet.findMany({
      where,
      include: {
        images: { orderBy: { sequence: 'asc' } },
        veterinary: { select: { name: true, logo: true } },
        owner: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pets.map((p) => ({
      id: p.id,
      name: p.name,
      petType: p.petType,
      species: p.species,
      breed: p.breed || '',
      birthDate: p.birthDate ? p.birthDate.toISOString().split('T')[0] : null,
      sex: p.sex,
      weight: p.weight,
      color: p.color || '',
      microchipId: p.microchipId || '',
      imageUrls: p.images.map((i) => this.fileUpload.getFullUrl(i.imageUrl)).filter(Boolean),
      status: p.status,
      description: p.description || '',
      veterinaryId: p.veterinaryId,
      veterinaryName: p.veterinary.name,
      veterinaryLogo: p.veterinary.logo || '',
      ownerId: p.owner?.id || null,
      rescuedAt: p.rescuedAt?.toISOString() || null,
      adoptedAt: p.adoptedAt?.toISOString() || null,
      sterilized: p.sterilized,
      allergies: p.allergies,
      vaccinations: p.vaccinations,
    }));
  }

  async findOne(id: number) {
    const p = await this.prisma.pet.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sequence: 'asc' } },
        veterinary: { select: { name: true, logo: true } },
        owner: { select: { id: true } },
      },
    });
    if (!p) throw new NotFoundException('Pet not found');

    return {
      id: p.id,
      name: p.name,
      petType: p.petType,
      species: p.species,
      breed: p.breed || '',
      birthDate: p.birthDate ? p.birthDate.toISOString().split('T')[0] : null,
      sex: p.sex,
      weight: p.weight,
      color: p.color || '',
      microchipId: p.microchipId || '',
      imageUrls: p.images.map((i) => this.fileUpload.getFullUrl(i.imageUrl)).filter(Boolean),
      status: p.status,
      description: p.description || '',
      veterinaryId: p.veterinaryId,
      veterinaryName: p.veterinary.name,
      veterinaryLogo: p.veterinary.logo || '',
      ownerId: p.owner?.id || null,
      rescuedAt: p.rescuedAt?.toISOString() || null,
      adoptedAt: p.adoptedAt?.toISOString() || null,
      sterilized: p.sterilized,
      allergies: p.allergies,
      vaccinations: p.vaccinations,
    };
  }

  async create(data: any) {
    const pet = await this.prisma.pet.create({
      data: {
        name: data.name,
        petType: data.petType || 'adoption',
        species: data.species || 'dog',
        breed: data.breed,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        sex: data.sex || 'unknown',
        weight: data.weight || 0,
        color: data.color,
        microchipId: data.microchipId,
        status: data.status || 'available',
        description: data.description || '',
        veterinaryId: parseInt(data.veterinaryId),
        sterilized: data.sterilized || false,
        allergies: data.allergies || [],
        vaccinations: data.vaccinations || [],
        ownerId: data.ownerId ? parseInt(data.ownerId) : null,
      },
    });
    return { success: true, id: pet.id, name: pet.name };
  }

  async update(id: number, data: any) {
    const pet = await this.prisma.pet.findUnique({ where: { id } });
    if (!pet) throw new NotFoundException('Pet not found');

    const updateData: any = {};
    const fields = ['name', 'petType', 'species', 'breed', 'sex', 'weight', 'color',
      'microchipId', 'status', 'description', 'sterilized', 'allergies', 'vaccinations'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }
    if (data.birthDate !== undefined) updateData.birthDate = new Date(data.birthDate);
    if (data.ownerId !== undefined) updateData.ownerId = parseInt(data.ownerId);

    await this.prisma.pet.update({ where: { id }, data: updateData });
    return { success: true };
  }

  async addImage(petId: number, url: string) {
    const maxSeq = await this.prisma.petImage.findFirst({
      where: { petId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return this.prisma.petImage.create({
      data: { petId, imageUrl: url, sequence: (maxSeq?.sequence ?? 0) + 10 },
    });
  }

  async getImage(id: number) {
    return this.prisma.petImage.findUnique({ where: { id } });
  }

  async deleteImage(id: number) {
    await this.prisma.petImage.delete({ where: { id } });
  }

  async remove(id: number) {
    await this.prisma.pet.delete({ where: { id } });
    return { success: true };
  }

  async getRecords(petId: number) {
    return this.prisma.medicalRecord.findMany({
      where: { petId },
      include: { attachments: true },
      orderBy: { visitDate: 'desc' },
    });
  }

  async getVaccines(petId: number) {
    return this.prisma.vaccine.findMany({
      where: { petId },
      orderBy: { administeredAt: 'desc' },
    });
  }

  async createVaccine(petId: number, data: any) {
    const vaccine = await this.prisma.vaccine.create({
      data: {
        petId,
        vaccineName: data.vaccineName,
        batchNumber: data.batchNumber,
        administeredAt: data.administeredAt ? new Date(data.administeredAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        veterinarianName: data.veterinarianName,
        manufacturer: data.manufacturer,
        nextDoseDate: data.nextDoseDate ? new Date(data.nextDoseDate) : null,
        notes: data.notes,
      },
    });
    return { success: true, id: vaccine.id };
  }

  async getPrescriptions(petId: number) {
    return this.prisma.prescription.findMany({
      where: { petId },
      include: { lines: true },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async createPrescription(petId: number, data: any) {
    const prescription = await this.prisma.prescription.create({
      data: {
        petId,
        recordId: data.recordId ? parseInt(data.recordId) : undefined,
        veterinarianName: data.veterinarianName || '',
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        instructions: data.instructions,
        isDispensed: data.isDispensed || false,
        lines: data.items?.length
          ? { create: data.items.map((item: any) => ({ productName: item.productName, dosage: item.dosage, frequency: item.frequency, duration: item.duration, quantity: item.quantity, instructions: item.instructions })) }
          : undefined,
      },
      include: { lines: true },
    });
    return { success: true, id: prescription.id };
  }
}
