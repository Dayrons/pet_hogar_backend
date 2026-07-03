import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles, Res } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { VeterinariesService } from './veterinaries.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { CreateVeterinaryDto } from './dto/create-veterinary.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('veterinaries')
@Controller('veterinaries')
export class VeterinariesController {
  constructor(
    private veterinariesService: VeterinariesService,
    private fileUpload: FileUploadService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all veterinaries' })
  async findAll(@Query() query: { type?: string; city?: string; isEmergency?: string }) {
    return this.veterinariesService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('nearby')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find nearby veterinaries' })
  async getNearby(@Query('lat') lat: string, @Query('lng') lng: string, @Query('radius') radius?: string) {
    return this.veterinariesService.getNearby(parseFloat(lat), parseFloat(lng), radius ? parseFloat(radius) : 10);
  }

  @Public()
  @Get(':id/logo')
  @ApiOperation({ summary: 'Get veterinary logo image (public)' })
  async getLogo(@Param('id') id: string, @Res() res: Response) {
    const vet = await this.veterinariesService.getRaw(parseInt(id));
    if (!vet?.logo || !this.fileUpload.fileExists(vet.logo)) {
      res.status(404).send();
      return;
    }
    res.sendFile(this.fileUpload.getFilePath(vet.logo));
  }

  @Public()
  @Get(':id/cover')
  @ApiOperation({ summary: 'Get veterinary cover image (public)' })
  async getCover(@Param('id') id: string, @Res() res: Response) {
    const vet = await this.veterinariesService.getRaw(parseInt(id));
    if (!vet?.coverImage || !this.fileUpload.fileExists(vet.coverImage)) {
      res.status(404).send();
      return;
    }
    res.sendFile(this.fileUpload.getFilePath(vet.coverImage));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get veterinary details' })
  async findOne(@Param('id') id: string) {
    return this.veterinariesService.findOne(parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateVeterinaryDto })
  @ApiOperation({ summary: 'Create a veterinary (multipart: fields + logo/cover files)' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]))
  async create(
    @Body() body: CreateVeterinaryDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[]; cover?: Express.Multer.File[] },
    @CurrentUser() user: any,
  ) {
    if (files?.logo?.[0]) body.logo = await this.fileUpload.saveFile('veterinaries', files.logo[0]);
    if (files?.cover?.[0]) (body as any).coverImage = await this.fileUpload.saveFile('veterinaries', files.cover[0]);
    return this.veterinariesService.create(body as any, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateVeterinaryDto })
  @ApiOperation({ summary: 'Update a veterinary (multipart: fields + logo/cover files)' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]))
  async update(
    @Param('id') id: string,
    @Body() body: CreateVeterinaryDto,
    @UploadedFiles() files: { logo?: Express.Multer.File[]; cover?: Express.Multer.File[] },
  ) {
    if (files?.logo?.[0]) {
      const old = await this.veterinariesService.getField(parseInt(id), 'logo');
      if (old) this.fileUpload.deleteFile(old);
      body.logo = await this.fileUpload.saveFile('veterinaries', files.logo[0]);
    }
    if (files?.cover?.[0]) {
      const old = await this.veterinariesService.getField(parseInt(id), 'coverImage');
      if (old) this.fileUpload.deleteFile(old);
      (body as any).coverImage = await this.fileUpload.saveFile('veterinaries', files.cover[0]);
    }
    return this.veterinariesService.update(parseInt(id), body as any);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a veterinary (soft)' })
  async remove(@Param('id') id: string) {
    return this.veterinariesService.remove(parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/coordinates')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update veterinary coordinates' })
  async updateCoordinates(@Param('id') id: string, @Body() body: { latitude?: number; longitude?: number }) {
    return this.veterinariesService.updateCoordinates(parseInt(id), body.latitude, body.longitude);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/services')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List veterinary services' })
  async getServices(@Param('id') id: string) {
    return this.veterinariesService.getServices(parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/services')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a veterinary service' })
  async createService(@Param('id') id: string, @Body('name') name: string) {
    return this.veterinariesService.createService(parseInt(id), name);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/schedule')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get veterinary schedule' })
  async getSchedule(@Param('id') id: string) {
    return this.veterinariesService.getSchedule(parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/schedule')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update veterinary schedule' })
  async updateSchedule(@Param('id') id: string, @Body('schedule') schedule: any[]) {
    return this.veterinariesService.updateSchedule(parseInt(id), schedule);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/social-links')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get veterinary social links' })
  async getSocialLinks(@Param('id') id: string) {
    return this.veterinariesService.getSocialLinks(parseInt(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/social-links')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a social link' })
  async createSocialLink(@Param('id') id: string, @Body() body: { name: string; url: string }) {
    return this.veterinariesService.createSocialLink(parseInt(id), body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/clients')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List veterinary clients' })
  async getClients(@Param('id') id: string) {
    return this.veterinariesService.getClients(parseInt(id));
  }
}
