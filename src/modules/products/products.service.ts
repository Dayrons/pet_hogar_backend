import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async findAll(query: { category?: string; veterinaryId?: string; search?: string; requiresPrescription?: string; includeInactive?: string }) {
    const where: any = {};
    if (!query.includeInactive) where.isActive = true;
    if (query.category) where.category = query.category;
    if (query.veterinaryId) where.veterinaryId = parseInt(query.veterinaryId);
    if (query.requiresPrescription === 'true') where.requiresPrescription = true;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sequence: 'asc' } },
        veterinary: { select: { name: true, logo: true } },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      sku: p.sku || '',
      barcode: p.barcode || '',
      price: p.price,
      costPrice: p.costPrice,
      taxRate: 0,
      stock: p.stock,
      minStock: p.minStock,
      unit: p.unit || 'unit(s)',
      category: p.category,
      subcategory: '',
      brand: p.brand || '',
      imageUrls: p.images.map((i) => this.fileUpload.getFullUrl(i.imageUrl)).filter(Boolean),
      requiresPrescription: p.requiresPrescription,
      isActive: p.isActive,
      veterinaryId: p.veterinaryId,
      veterinaryName: p.veterinary.name,
      veterinaryLogo: p.veterinary.logo || '',
      distanceKm: 0,
    }));
  }

  async create(data: any) {
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        price: data.price || 0,
        costPrice: data.costPrice || 0,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        category: data.category || 'food',
        brand: data.brand,
        requiresPrescription: data.requiresPrescription || false,
        minStock: data.minStock || 5,
        isActive: data.isActive !== undefined ? data.isActive : true,
        veterinaryId: parseInt(data.veterinaryId),
      },
    });
    return { success: true, id: product.id };
  }

  async update(id: number, data: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    const updateData: any = {};
    const fields = ['name', 'price', 'costPrice', 'sku', 'barcode', 'description', 'category',
      'brand', 'requiresPrescription', 'minStock', 'isActive', 'veterinaryId'];
    for (const f of fields) {
      if (data[f] !== undefined) updateData[f] = data[f];
    }

    await this.prisma.product.update({ where: { id }, data: updateData });
    return { success: true };
  }

  async syncFromOdoo(payload: any, action: string): Promise<void> {
    const existing = payload.id
      ? await this.prisma.product.findFirst({ where: { odooProductId: payload.id } })
      : null;

    const localImagePath = await this.fileUpload.saveBase64('products', payload.image_data);

    const data: any = {
      odooProductId: payload.id,
      name: payload.name,
      description: payload.description || '',
      price: payload.price || 0,
      stock: payload.stock || 0,
      category: payload.veterinary_category || 'food',
      requiresPrescription: payload.requires_prescription || false,
      isActive: payload.is_active !== undefined ? payload.is_active : true,
      veterinaryId: payload.veterinary_id,
    };

    let productId: number;
    if (action === 'create' || (action === 'update' && !existing)) {
      const created = await this.prisma.product.upsert({ where: { id: existing?.id || 0 }, create: data, update: data });
      productId = created.id;
    } else if (action === 'update' && existing) {
      await this.prisma.product.update({ where: { id: existing.id }, data });
      productId = existing.id;
    } else {
      return;
    }

    const images = localImagePath ? [{ imageUrl: localImagePath, sequence: 10 }] : [];
    if (images.length > 0) {
      await this.prisma.productImage.deleteMany({ where: { productId } });
      for (const img of images) {
        await this.prisma.productImage.create({ data: { productId, ...img } });
      }
    }
  }

  async addImage(productId: number, relativePath: string) {
    const maxSeq = await this.prisma.productImage.findFirst({
      where: { productId },
      orderBy: { sequence: 'desc' },
      select: { sequence: true },
    });
    return this.prisma.productImage.create({
      data: { productId, imageUrl: relativePath, sequence: (maxSeq?.sequence ?? 0) + 10 },
    });
  }

  async getImage(id: number) {
    return this.prisma.productImage.findUnique({ where: { id } });
  }

  async deleteImage(id: number) {
    await this.prisma.productImage.delete({ where: { id } });
  }

  async getField(id: number, field: string): Promise<string | null> {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { [field]: true } });
    const val = product?.[field as keyof typeof product];
    return typeof val === 'string' ? val : null;
  }

  async softDelete(id: number) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }
}
