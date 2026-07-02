import { Injectable, Logger } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, unlinkSync, writeFileSync, createReadStream } from 'fs';
import { join, extname } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly baseDir = join(__dirname, '..', '..', '..', 'uploads');

  constructor(private configService: ConfigService) {}

  saveFile(entity: string, file: Express.Multer.File): string {
    const dir = join(this.baseDir, entity);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const ext = extname(file.originalname) || '.jpg';
    const filename = `${uuid()}${ext}`;
    const filePath = join(dir, filename);

    writeFileSync(filePath, file.buffer);
    this.logger.log(`Saved file: ${filePath}`);

    return `${entity}/${filename}`;
  }

  getFullUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    const baseUrl = this.configService.get<string>('API_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${relativePath}`;
  }

  deleteFile(relativePath: string): void {
    if (!relativePath) return;
    const fullPath = join(this.baseDir, relativePath);
    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
      this.logger.log(`Deleted file: ${fullPath}`);
    }
  }

  getFilePath(relativePath: string): string {
    return join(this.baseDir, relativePath);
  }

  getStream(relativePath: string): StreamableFile {
    const fullPath = join(this.baseDir, relativePath);
    const stream = createReadStream(fullPath);
    return new StreamableFile(stream);
  }

  fileExists(relativePath: string): boolean {
    return existsSync(join(this.baseDir, relativePath));
  }
}
