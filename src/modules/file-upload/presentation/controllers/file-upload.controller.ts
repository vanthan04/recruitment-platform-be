import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileUploadService } from '../../application/file-upload.service';
import { ApiResponse } from '@/common/dtos/api-response';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UploadFileOptionsDto } from '@/modules/file-upload/presentation/dtos/upload-file-options.dto';
import {
  ALLOWED_MIME_TYPES_BY_FOLDER,
  UploadFolder,
} from '@/modules/file-upload/domain/value-objects/upload-folder.vo';

// Same pattern as CV_MAX_FILE_SIZE (cv.controller.ts) — was hardcoded with
// no way to raise it without a redeploy, unlike every other upload-size
// concern in the codebase.
const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_BYTES = parseInt(
  process.env.GENERIC_UPLOAD_MAX_FILE_SIZE || `${DEFAULT_MAX_FILE_SIZE_BYTES}`,
  10,
);

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
          enum: Object.values(UploadFolder),
          description: 'Thư mục muốn lưu trữ',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE_BYTES } }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() { folder }: UploadFileOptionsDto,
  ) {
    const result = await this.fileUploadService.uploadFile(
      file,
      folder,
      ALLOWED_MIME_TYPES_BY_FOLDER[folder],
    );
    return ApiResponse.ok(result, 'Upload file thành công');
  }
}
