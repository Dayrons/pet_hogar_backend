import { Injectable, Logger } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync, writeFileSync, createReadStream } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';

export interface OptimizeOptions {
  quality?: number;
  alphaQuality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
  stripMetadata?: boolean;
}

export interface OptimizeResult {
  buffer: Buffer;
  ext: string;
  originalSize: number;
  optimizedSize: number;
  skipped: boolean;
}

const DEFAULT_OPTIONS: OptimizeOptions = {
  quality: 80,
  alphaQuality: 80,
  maxWidth: 1920,
  maxHeight: 1920,
  format: 'webp',
  stripMetadata: true,
};

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly baseDir = join(__dirname, '..', '..', '..', '..', 'uploads');

  constructor(private configService: ConfigService) {}

  private isOdooPlaceholder(res: Response, buffer: Buffer): boolean {
    const contentDisposition = res.headers.get('content-disposition') || '';
    if (contentDisposition.includes('placeholder.png')) return true;
    if (
      buffer.length >= 24 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
    ) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width === 256 && height === 256) return true;
    }
    return false;
  }

  async downloadFromOdoo(odooRelativeUrl: string, entityDir: string): Promise<string | null> {
    if (!odooRelativeUrl) return null;
    try {
      const odooBaseUrl = this.configService.get<string>('ODOO_BASE_URL', 'http://localhost:8060');
      const res = await fetch(`${odooBaseUrl}${odooRelativeUrl}`);
      if (!res.ok) {
        this.logger.warn(`Failed to download image from ${odooRelativeUrl}: ${res.status}`);
        return null;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      if (this.isOdooPlaceholder(res, buffer)) {
        this.logger.warn(`Skipped Odoo default placeholder: ${odooRelativeUrl}`);
        return null;
      }
      return this.saveBuffer(entityDir, buffer);
    } catch (err) {
      this.logger.error(`Failed to download image ${odooRelativeUrl}: ${err}`);
      return null;
    }
  }

  async optimizeImage(buffer: Buffer, options?: OptimizeOptions): Promise<OptimizeResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = buffer.length;
    const meta = sharp(buffer);
    const { format } = await meta.metadata();

    let ext = `.${opts.format}`;
    let pipeline = meta.rotate().resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });

    if (format === 'gif') {
      ext = '.gif';
      pipeline = pipeline.gif();
    } else if (format === 'svg') {
      return { buffer, ext: '.svg', originalSize, optimizedSize: originalSize, skipped: true };
    } else if (opts.format === 'webp') {
      pipeline = pipeline.webp({
        quality: opts.quality,
        alphaQuality: opts.alphaQuality,
        nearLossless: false,
        smartSubsample: true,
      });
    } else if (opts.format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
    } else if (opts.format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    }

    const optimized = await pipeline.toBuffer();

    if (optimized.length >= originalSize) {
      return { buffer, ext, originalSize, optimizedSize: originalSize, skipped: true };
    }

    return { buffer: optimized, ext, originalSize, optimizedSize: optimized.length, skipped: false };
  }

  async optimizeImages(buffers: Buffer[], options?: OptimizeOptions): Promise<OptimizeResult[]> {
    return Promise.all(buffers.map((b) => this.optimizeImage(b, options)));
  }

  async saveBuffer(entity: string, buffer: Buffer): Promise<string> {
    const { buffer: optimized, ext } = await this.optimizeImage(buffer);

    const dir = join(this.baseDir, entity);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const filename = `${uuid()}${ext}`;
    writeFileSync(join(dir, filename), optimized);
    return `${entity}/${filename}`;
  }

  async saveBase64(entity: string, base64: string): Promise<string | null> {
    if (!base64) return null;
    try {
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length === 0) return null;
      return this.saveBuffer(entity, buffer);
    } catch (err) {
      this.logger.error(`Failed to decode base64 image: ${err}`);
      return null;
    }
  }

  async saveFile(entity: string, file: Express.Multer.File): Promise<string> {
    return this.saveBuffer(entity, file.buffer);
  }

  getFullUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    const baseUrl = this.configService.get<string>('API_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${relativePath}`;
  }

  deleteFile(relativePath: string): void {
    if (!relativePath) return;
    const fullPath = join(this.baseDir, relativePath);
    if (existsSync(fullPath)) unlinkSync(fullPath);
  }

  getFilePath(relativePath: string): string {
    return join(this.baseDir, relativePath);
  }

  getStream(relativePath: string): StreamableFile {
    return new StreamableFile(createReadStream(join(this.baseDir, relativePath)));
  }

  fileExists(relativePath: string): boolean {
    return existsSync(join(this.baseDir, relativePath));
  }
}
