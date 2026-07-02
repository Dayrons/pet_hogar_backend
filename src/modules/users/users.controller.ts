import { Controller, Get, Put, Body, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { FileUploadService } from '../../shared/services/file-upload.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private usersService: UsersService,
    private fileUpload: FileUploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Put()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileDto })
  @ApiOperation({ summary: 'Update user profile (multipart: fields + photo file)' })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }]))
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: UpdateProfileDto,
    @UploadedFiles() files: { photo?: Express.Multer.File[] },
  ) {
    if (files?.photo?.[0]) {
      const old = await this.usersService.getField(user.id, 'photoUrl');
      if (old) this.fileUpload.deleteFile(old);
      (body as any).photoUrl = this.fileUpload.saveFile('users', files.photo[0]);
    }
    return this.usersService.updateProfile(user.id, body);
  }
}
