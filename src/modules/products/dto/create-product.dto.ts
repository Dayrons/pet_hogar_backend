import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  sku?: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  costPrice?: number;

  @ApiPropertyOptional()
  stock?: number;

  @ApiPropertyOptional()
  minStock?: number;

  @ApiPropertyOptional()
  unit?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  brand?: string;

  @ApiPropertyOptional()
  requiresPrescription?: boolean;

  @ApiPropertyOptional()
  isActive?: boolean;

  @ApiProperty()
  veterinaryId: number;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' } })
  images?: any[];
}
