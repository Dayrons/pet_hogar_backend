import crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

type SyncEntity = 'user' | 'veterinary' | 'pet' | 'product' | 'specialist' | 'adoption';
type SyncAction = 'create' | 'update' | 'delete';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private odooToken: string | null = null;
  private readonly odooBaseUrl: string;
  private readonly odooDb: string;
  private readonly odooUser: string;
  private readonly odooPassword: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.odooBaseUrl = this.configService.get<string>('ODOO_BASE_URL')!;
    this.odooDb = this.configService.get<string>('ODOO_DB')!;
    this.odooUser = this.configService.get<string>('ODOO_USER')!;
    this.odooPassword = this.configService.get<string>('ODOO_PASSWORD')!;
  }

  private async authenticateOdoo(): Promise<string> {
    if (this.odooToken) return this.odooToken;

    try {
      const res = await fetch(`${this.odooBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.odooUser,
          password: this.odooPassword,
        }),
      });
      const json = await res.json() as any;
      this.odooToken = json.data?.token || json.token;
      return this.odooToken!;
    } catch (err) {
      this.logger.error(`Failed to authenticate with Odoo: ${err}`);
      throw err;
    }
  }

  private async odooRequest(path: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authenticateOdoo();
    const url = `${this.odooBaseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Sync-Source': 'nestjs',
        ...(options.headers || {}),
      },
    });
    if (!res.ok) {
      this.logger.warn(`Odoo request failed: ${res.status} ${res.statusText} for ${path}`);
    }
    return res.json();
  }

  async pushToOdoo(entity: SyncEntity, action: SyncAction, data: any, odooIdField?: string): Promise<void> {
    const existingOdooId = odooIdField ? data[odooIdField] : null;

    try {
      if (action === 'create' || (action === 'update' && !existingOdooId)) {
        const result = await this.odooRequest(`/api/v1/${entity}s`, {
          method: 'POST',
          body: JSON.stringify(data),
        });
        this.logger.log(`Pushed ${entity} to Odoo (create): ${JSON.stringify(result).slice(0, 100)}`);
      } else if (action === 'update' && existingOdooId) {
        await this.odooRequest(`/api/v1/${entity}s/${existingOdooId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        this.logger.log(`Pushed ${entity} to Odoo (update): id=${existingOdooId}`);
      } else if (action === 'delete' && existingOdooId) {
        await this.odooRequest(`/api/v1/${entity}s/${existingOdooId}`, {
          method: 'DELETE',
        });
        this.logger.log(`Pushed ${entity} to Odoo (delete): id=${existingOdooId}`);
      }
    } catch (err) {
      this.logger.error(`Failed to push ${entity} to Odoo: ${err}`);
    }
  }

  async handleWebhook(entity: string, action: string, payload: any): Promise<void> {
    this.logger.log(`Webhook received: ${entity}.${action} from Odoo`);

    try {
      switch (entity) {
        case 'veterinary': {
          const data = this.mapOdooVeterinary(payload);
          const existing = data.odooVeterinaryId
            ? await this.prisma.veterinary.findFirst({ where: { odooVeterinaryId: data.odooVeterinaryId } })
            : null;

          if (action === 'create' || (action === 'update' && !existing)) {
            await this.prisma.veterinary.upsert({
              where: { id: existing?.id || 0 },
              create: data,
              update: data,
            });
          } else if (action === 'update' && existing) {
            await this.prisma.veterinary.update({ where: { id: existing.id }, data });
          }
          break;
        }
        case 'pet': {
          const data = this.mapOdooPet(payload);
          const existing = data.odooPetId
            ? await this.prisma.pet.findFirst({ where: { odooPetId: data.odooPetId } })
            : null;

          if (action === 'create' || (action === 'update' && !existing)) {
            await this.prisma.pet.upsert({
              where: { id: existing?.id || 0 },
              create: data,
              update: data,
            });
          } else if (action === 'update' && existing) {
            await this.prisma.pet.update({ where: { id: existing.id }, data });
          }
          break;
        }
        case 'product': {
          const data = this.mapOdooProduct(payload);
          const existing = data.odooProductId
            ? await this.prisma.product.findFirst({ where: { odooProductId: data.odooProductId } })
            : null;

          if (action === 'create' || (action === 'update' && !existing)) {
            await this.prisma.product.upsert({
              where: { id: existing?.id || 0 },
              create: data,
              update: data,
            });
          } else if (action === 'update' && existing) {
            await this.prisma.product.update({ where: { id: existing.id }, data });
          }
          break;
        }
        case 'user': {
          const data = this.mapOdooUser(payload);
          const existing = data.odooUserId
            ? await this.prisma.user.findFirst({ where: { odooUserId: data.odooUserId } })
            : null;

          if (action === 'create' && !existing) {
            await this.prisma.user.create({ data });
          } else if (action === 'update' && existing) {
            await this.prisma.user.update({ where: { id: existing.id }, data });
          }
          break;
        }
        case 'specialist': {
          const data = this.mapOdooSpecialist(payload);
          const existing = await this.prisma.specialist.findFirst({
            where: { name: data.name, veterinaryId: data.veterinaryId },
          });

          if (action === 'create' && !existing) {
            await this.prisma.specialist.create({ data });
          } else if (action === 'update' && existing) {
            await this.prisma.specialist.update({ where: { id: existing.id }, data });
          }
          break;
        }
        default:
          this.logger.warn(`Unknown entity type in webhook: ${entity}`);
      }
    } catch (err) {
      this.logger.error(`Error handling webhook for ${entity}: ${err}`);
    }
  }

  private mapOdooVeterinary(payload: any) {
    return {
      odooVeterinaryId: payload.id,
      name: payload.name,
      tagline: payload.tagline || '',
      phone: payload.phone || '',
      email: payload.email || '',
      address: payload.address || '',
      city: payload.city || '',
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      rating: payload.rating || 0,
      isEmergency: payload.is_emergency || false,
      isOpen: payload.is_open !== undefined ? payload.is_open : true,
      type: payload.type || 'clinic',
    };
  }

  private mapOdooPet(payload: any) {
    return {
      odooPetId: payload.id,
      name: payload.name,
      species: payload.species || 'dog',
      breed: payload.breed || '',
      sex: payload.sex || 'unknown',
      weight: payload.weight || 0,
      status: payload.status || 'available',
      description: payload.description || '',
      veterinaryId: payload.veterinary_id,
      sterilized: payload.sterilized || false,
      allergies: payload.allergies || [],
      vaccinations: payload.vaccinations || [],
    };
  }

  private mapOdooProduct(payload: any) {
    return {
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
  }

  private mapOdooUser(payload: any) {
    return {
      odooUserId: payload.id,
      name: payload.name,
      email: payload.email,
      password: crypto.randomUUID() + '_odoo_sync',
      phone: payload.phone || '',
      role: (payload.role || 'adopter').toUpperCase() as any,
    };
  }

  private mapOdooSpecialist(payload: any) {
    return {
      name: payload.name,
      phone: payload.phone || '',
      email: payload.email || '',
      licenseNumber: payload.license_number || '',
      veterinaryId: payload.veterinary_id,
    };
  }
}
