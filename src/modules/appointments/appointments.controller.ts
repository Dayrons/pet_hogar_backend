import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments' })
  async findAll(@Query() query: { status?: string; veterinaryId?: string; petId?: string; fromDate?: string; toDate?: string }) {
    return this.appointmentsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create appointment' })
  async create(@Body() body: any) {
    return this.appointmentsService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update appointment' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.appointmentsService.update(parseInt(id), body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete appointment' })
  async remove(@Param('id') id: string) {
    return this.appointmentsService.remove(parseInt(id));
  }
}
