import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVeterinaryDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  tagline?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  taxId?: string;

  @ApiPropertyOptional()
  licenseNumber?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  type?: string;

  @ApiPropertyOptional()
  isEmergency?: boolean;

  @ApiPropertyOptional()
  isHospital?: boolean;

  @ApiPropertyOptional()
  isOpen?: boolean;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  logo?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  cover?: any;
}
