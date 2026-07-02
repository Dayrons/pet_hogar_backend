import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('specialists')
@Controller('specialists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SpecialistsController {
  constructor(private specialistsService: SpecialistsService) {}

  @Get()
  @ApiOperation({ summary: 'List specialists' })
  async findAll(@Query() query: { veterinaryId?: string; search?: string }) {
    return this.specialistsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create specialist' })
  async create(@Body() body: any) {
    return this.specialistsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update specialist' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.specialistsService.update(parseInt(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specialist' })
  async remove(@Param('id') id: string) {
    return this.specialistsService.remove(parseInt(id));
  }
}
