import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePetDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  petType?: string;

  @ApiPropertyOptional()
  species?: string;

  @ApiPropertyOptional()
  breed?: string;

  @ApiPropertyOptional()
  birthDate?: string;

  @ApiPropertyOptional()
  sex?: string;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  microchipId?: string;

  @ApiPropertyOptional()
  status?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  veterinaryId: number;

  @ApiPropertyOptional()
  sterilized?: boolean;

  @ApiPropertyOptional()
  allergies?: string[];

  @ApiPropertyOptional()
  vaccinations?: string[];

  @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' } })
  images?: any[];
}
