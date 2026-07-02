import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PetsService } from './pets.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('pets')
@Controller('pets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PetsController {
  constructor(
    private petsService: PetsService,
    private fileUpload: FileUploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List pets' })
  async findAll(@Query() query: { status?: string; veterinaryId?: string; species?: string; search?: string }) {
    return this.petsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pet details' })
  async findOne(@Param('id') id: string) {
    return this.petsService.findOne(parseInt(id));
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePetDto })
  @ApiOperation({ summary: 'Create a pet (multipart: fields + images[] files)' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
  async create(
    @Body() body: CreatePetDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const result = await this.petsService.create(body);
    if (files?.images?.length) {
      for (const file of files.images) {
        const path = this.fileUpload.saveFile('pets', file);
        await this.petsService.addImage(result.id, path);
      }
    }
    return result;
  }

  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePetDto })
  @ApiOperation({ summary: 'Update a pet (multipart: fields + images[] files)' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
  async update(
    @Param('id') id: string,
    @Body() body: CreatePetDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const result = await this.petsService.update(parseInt(id), body);
    if (files?.images?.length) {
      for (const file of files.images) {
        const path = this.fileUpload.saveFile('pets', file);
        await this.petsService.addImage(parseInt(id), `/uploads/${path}`);
      }
    }
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pet' })
  async remove(@Param('id') id: string) {
    return this.petsService.remove(parseInt(id));
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a pet image' })
  async deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    const image = await this.petsService.getImage(parseInt(imageId));
    if (image?.imageUrl) this.fileUpload.deleteFile(image.imageUrl);
    await this.petsService.deleteImage(parseInt(imageId));
    return { success: true };
  }

  @Get(':id/records')
  @ApiOperation({ summary: 'Get pet medical records' })
  async getRecords(@Param('id') id: string) {
    return this.petsService.getRecords(parseInt(id));
  }

  @Get(':id/vaccines')
  @ApiOperation({ summary: 'Get pet vaccines' })
  async getVaccines(@Param('id') id: string) {
    return this.petsService.getVaccines(parseInt(id));
  }

  @Post(':id/vaccines')
  @ApiOperation({ summary: 'Add vaccine to pet' })
  async createVaccine(@Param('id') id: string, @Body() body: any) {
    return this.petsService.createVaccine(parseInt(id), body);
  }

  @Get(':id/prescriptions')
  @ApiOperation({ summary: 'Get pet prescriptions' })
  async getPrescriptions(@Param('id') id: string) {
    return this.petsService.getPrescriptions(parseInt(id));
  }

  @Post(':id/prescriptions')
  @ApiOperation({ summary: 'Create prescription for pet' })
  async createPrescription(@Param('id') id: string, @Body() body: any) {
    return this.petsService.createPrescription(parseInt(id), body);
  }
}
