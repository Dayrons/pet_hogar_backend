import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private fileUpload: FileUploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  async findAll(@Query() query: { category?: string; veterinaryId?: string; search?: string; requiresPrescription?: string; includeInactive?: string }) {
    return this.productsService.findAll(query);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Create product (multipart: fields + images[] files)' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
  async create(
    @Body() body: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const result = await this.productsService.create(body);
    if (files?.images?.length) {
      for (const file of files.images) {
        const path = await this.fileUpload.saveFile('products', file);
        await this.productsService.addImage(result.id, path);
      }
    }
    return result;
  }

  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Update product (multipart: fields + images[] files)' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'images', maxCount: 10 }]))
  async update(
    @Param('id') id: string,
    @Body() body: CreateProductDto,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
  ) {
    const result = await this.productsService.update(parseInt(id), body);
    if (files?.images?.length) {
      for (const file of files.images) {
        const path = await this.fileUpload.saveFile('products', file);
        await this.productsService.addImage(parseInt(id), path);
      }
    }
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete product' })
  async remove(@Param('id') id: string) {
    return this.productsService.softDelete(parseInt(id));
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete a product image' })
  async deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    const image = await this.productsService.getImage(parseInt(imageId));
    if (image?.imageUrl) this.fileUpload.deleteFile(image.imageUrl);
    await this.productsService.deleteImage(parseInt(imageId));
    return { success: true };
  }
}
