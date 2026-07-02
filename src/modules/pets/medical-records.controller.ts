import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('records')
@Controller('records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicalRecordsController {
  constructor(private service: MedicalRecordsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get medical record' })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create medical record' })
  async create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update medical record' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(parseInt(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete medical record' })
  async remove(@Param('id') id: string) {
    return this.service.remove(parseInt(id));
  }
}
