import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateCvCommand } from '@/modules/cv/application/commands/create-cv.command';
import { UpdateCvCommand } from '@/modules/cv/application/commands/update-cv.command';
import { DeleteCvCommand } from '@/modules/cv/application/commands/delete-cv.command';
import { PublishCvCommand } from '@/modules/cv/application/commands/publish-cv.command';
import { GetCvQuery } from '@/modules/cv/application/queries/get-cv.query';
import { ListMyCvsQuery } from '@/modules/cv/application/queries/list-my-cvs.query';
import { DownloadCvQuery } from '@/modules/cv/application/queries/download-cv.query';

import { CreateCvDto } from '@/modules/cv/presentation/dtos/create-cv.dto';
import { UpdateCvDto } from '@/modules/cv/presentation/dtos/update-cv.dto';

// Multer buffers the whole upload into memory before CvDomainService ever
// gets a chance to reject it — so the Multer-layer ceiling has to match the
// actual configured business limit (not just sit comfortably above it), or
// a request between the two limits still buffers the full oversized payload
// into memory before being rejected. `+1024` covers multipart framing
// overhead so a file at exactly CV_MAX_FILE_SIZE doesn't get clipped by
// Multer before CvDomainService's own (more precise) size check runs.
const DEFAULT_CV_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MULTER_CV_SIZE_CEILING_BYTES =
  parseInt(
    process.env.CV_MAX_FILE_SIZE || `${DEFAULT_CV_MAX_FILE_SIZE_BYTES}`,
    10,
  ) + 1024;

@ApiTags('cvs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('cvs')
export class CvController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(Permission.CV_CREATE)
  @ApiOperation({ summary: 'Upload a new CV (PDF/DOC/DOCX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MULTER_CV_SIZE_CEILING_BYTES },
    }),
  )
  async create(
    @GetMe('id') userId: string,
    @Body() dto: CreateCvDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.commandBus.execute(
      new CreateCvCommand(userId, dto.title, file),
    );
    return ApiResponse.ok(result, 'CV uploaded successfully');
  }

  @Get()
  @RequirePermissions(Permission.CV_READ_OWN)
  @ApiOperation({ summary: 'List all my CVs' })
  async listMyCvs(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(new ListMyCvsQuery(userId));
    return ApiResponse.ok(result, 'CVs retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get CV metadata by ID (owner or a recruiter whose job it was applied to)',
  })
  async getById(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.queryBus.execute(new GetCvQuery(userId, id));
    return ApiResponse.ok(result, 'CV retrieved successfully');
  }

  @Get(':id/download')
  @ApiOperation({
    summary:
      'Get a time-limited presigned download URL for the CV file (owner or a recruiter whose job the CV was applied to)',
  })
  async download(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.queryBus.execute(new DownloadCvQuery(userId, id));
    return ApiResponse.ok(result, 'Download URL generated successfully');
  }

  @Patch(':id')
  @RequirePermissions(Permission.CV_UPDATE_OWN)
  @ApiOperation({ summary: 'Update CV title' })
  async update(
    @GetMe('id') userId: string,
    @Param('id') cvId: string,
    @Body() dto: UpdateCvDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateCvCommand(userId, cvId, { title: dto.title }),
    );
    return ApiResponse.ok(result, 'CV updated successfully');
  }

  @Patch(':id/publish')
  @RequirePermissions(Permission.CV_UPDATE_OWN)
  @ApiOperation({ summary: 'Publish CV' })
  async publish(@GetMe('id') userId: string, @Param('id') cvId: string) {
    const result = await this.commandBus.execute(
      new PublishCvCommand(userId, cvId),
    );
    return ApiResponse.ok(result, 'CV published successfully');
  }

  @Delete(':id')
  @RequirePermissions(Permission.CV_DELETE_OWN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete CV (soft delete)' })
  async delete(@GetMe('id') userId: string, @Param('id') cvId: string) {
    await this.commandBus.execute(new DeleteCvCommand(userId, cvId));
  }
}
