import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FileUploadService } from '../../application/file-upload.service';
import { ApiResponse } from '@/common/dtos/api-response';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';

@ApiTags('files')
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload file (Ảnh, tài liệu...)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Thư mục muốn lưu trữ (Vd: avatars, products)',
          default: 'general',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    const result = await this.fileUploadService.uploadFile(file, folder);
    return ApiResponse.ok(result, 'Upload file thành công');
  }
}
