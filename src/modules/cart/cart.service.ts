import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from '../../shared/services/file-upload.service';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async getCart(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, state: 'draft' },
      include: {
        lines: {
          include: {
            product: {
              select: {
                name: true,
                requiresPrescription: true,
                veterinaryId: true,
                veterinary: { select: { name: true } },
                images: { take: 1, orderBy: { sequence: 'asc' }, select: { imageUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) return { id: null, items: [], total: 0 };

    const items = cart.lines.map((l) => ({
      id: l.id,
      productId: l.productId,
      productName: l.productName || l.product.name,
      quantity: l.quantity,
      price: l.priceUnit || 0,
      total: l.subtotal || 0,
      imageUrl: this.fileUpload.getFullUrl(l.product.images[0]?.imageUrl) || '',
      veterinaryId: l.product.veterinaryId,
      veterinaryName: l.product.veterinary.name,
      requiresPrescription: l.product.requiresPrescription,
    }));

    return { id: cart.id, items, total: items.reduce((sum, i) => sum + i.total, 0) };
  }

  async addItem(userId: number, data: { productId: number; quantity?: number; veterinaryId?: number }) {
    let cart = await this.prisma.cart.findFirst({
      where: { userId, state: 'draft' },
      include: { lines: true },
    });

    if (!cart) {
      const partner = await this.prisma.partner.findUnique({ where: { userId } });
      if (!partner) throw new NotFoundException('Partner not found');

      cart = await this.prisma.cart.create({
        data: {
          partnerId: partner.id,
          userId,
          veterinaryId: data.veterinaryId,
        },
        include: { lines: true },
      });
    }

    const existingLine = cart.lines.find((l) => l.productId === data.productId);
    if (existingLine) {
      const qty = (data.quantity || 1) + existingLine.quantity;
      const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
      await this.prisma.cartLine.update({
        where: { id: existingLine.id },
        data: { quantity: qty, subtotal: qty * (product?.price || 0) },
      });
    } else {
      const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
      const qty = data.quantity || 1;
      await this.prisma.cartLine.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          productName: product?.name || '',
          quantity: qty,
          priceUnit: product?.price || 0,
          subtotal: qty * (product?.price || 0),
        },
      });
    }

    return { success: true, cartId: cart.id };
  }

  async updateLine(lineId: number, data: { quantity: number }) {
    const line = await this.prisma.cartLine.findUnique({ where: { id: lineId } });
    if (!line) throw new NotFoundException('Cart line not found');

    if (data.quantity <= 0) {
      await this.prisma.cartLine.delete({ where: { id: lineId } });
    } else {
      await this.prisma.cartLine.update({
        where: { id: lineId },
        data: {
          quantity: data.quantity,
          subtotal: data.quantity * (line.priceUnit || 0),
        },
      });
    }

    return { success: true };
  }

  async removeLine(lineId: number) {
    await this.prisma.cartLine.delete({ where: { id: lineId } });
    return { success: true };
  }

  async checkout(userId: number) {
    const cart = await this.prisma.cart.findFirst({
      where: { userId, state: 'draft' },
      include: { lines: true },
    });

    if (!cart) throw new NotFoundException('No draft cart found');

    const total = cart.lines.reduce((sum, l) => sum + (l.subtotal || 0), 0);

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { state: 'confirmed' },
    });

    return { success: true, cartId: cart.id, total };
  }
}
