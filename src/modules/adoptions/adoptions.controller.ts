import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdoptionsService } from './adoptions.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('adoptions')
@Controller('adoptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdoptionsController {
  constructor(private adoptionsService: AdoptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List adoptions' })
  async findAll(@Query() query: { status?: string; veterinaryId?: string }) {
    return this.adoptionsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create adoption request' })
  async create(@Body() body: any) {
    return this.adoptionsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update adoption' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.adoptionsService.update(parseInt(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete adoption' })
  async remove(@Param('id') id: string) {
    return this.adoptionsService.remove(parseInt(id));
  }
}
