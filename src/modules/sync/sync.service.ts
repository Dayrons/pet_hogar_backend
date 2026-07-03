import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VeterinariesService } from '../veterinaries/veterinaries.service';
import { PetsService } from '../pets/pets.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { SpecialistsService } from '../specialists/specialists.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private odooToken: string | null = null;
  private readonly odooBaseUrl: string;
  private readonly odooDb: string;
  private readonly odooUser: string;
  private readonly odooPassword: string;
  private readonly handlers: Record<string, (payload: any, action: string) => Promise<void>>;

  constructor(
    private configService: ConfigService,
    private veterinariesService: VeterinariesService,
    private petsService: PetsService,
    private productsService: ProductsService,
    private usersService: UsersService,
    private specialistsService: SpecialistsService,
  ) {
    this.odooBaseUrl = this.configService.get<string>('ODOO_BASE_URL')!;
    this.odooDb = this.configService.get<string>('ODOO_DB')!;
    this.odooUser = this.configService.get<string>('ODOO_USER')!;
    this.odooPassword = this.configService.get<string>('ODOO_PASSWORD')!;
    this.handlers = {
      veterinary: (p, a) => this.veterinariesService.syncFromOdoo(p, a),
      pet: (p, a) => this.petsService.syncFromOdoo(p, a),
      product: (p, a) => this.productsService.syncFromOdoo(p, a),
      user: (p, a) => this.usersService.syncFromOdoo(p, a),
      specialist: (p, a) => this.specialistsService.syncFromOdoo(p, a),
    };
  }

  private async authenticateOdoo(): Promise<string> {
    if (this.odooToken) return this.odooToken;
    try {
      const res = await fetch(`${this.odooBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.odooUser, password: this.odooPassword }),
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
    const res = await fetch(`${this.odooBaseUrl}${path}`, {
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

  async pushToOdoo(entity: string, action: string, data: any, odooIdField?: string): Promise<void> {
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
    const handler = this.handlers[entity];
    if (!handler) {
      this.logger.warn(`Unknown entity type in webhook: ${entity}`);
      return;
    }
    try {
      await handler(payload, action);
    } catch (err) {
      this.logger.error(`Error handling webhook for ${entity}: ${err}`);
    }
  }
}
