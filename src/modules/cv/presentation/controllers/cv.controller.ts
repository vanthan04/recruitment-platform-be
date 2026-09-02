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
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateCvUseCase } from '@/modules/cv/application/use-cases/create-cv.use-case';
import { UpdateCvUseCase } from '@/modules/cv/application/use-cases/update-cv.use-case';
import { PublishCvUseCase } from '@/modules/cv/application/use-cases/publish-cv.use-case';
import { GetCvUseCase } from '@/modules/cv/application/use-cases/get-cv.use-case';
import { ListMyCvsUseCase } from '@/modules/cv/application/use-cases/list-my-cvs.use-case';
import { DeleteCvUseCase } from '@/modules/cv/application/use-cases/delete-cv.use-case';
import { UploadCvFileUseCase } from '@/modules/cv/application/use-cases/upload-cv-file.use-case';
import { ExportCvPdfUseCase } from '@/modules/cv/application/use-cases/export-cv-pdf.use-case';

import { CreateCvDto } from '@/modules/cv/presentation/dtos/create-cv.dto';
import { UpdateCvDto } from '@/modules/cv/presentation/dtos/update-cv.dto';

const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@ApiTags('cvs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cvs')
export class CvController {
  constructor(
    private readonly createCvUseCase: CreateCvUseCase,
    private readonly updateCvUseCase: UpdateCvUseCase,
    private readonly publishCvUseCase: PublishCvUseCase,
    private readonly getCvUseCase: GetCvUseCase,
    private readonly listMyCvsUseCase: ListMyCvsUseCase,
    private readonly deleteCvUseCase: DeleteCvUseCase,
    private readonly uploadCvFileUseCase: UploadCvFileUseCase,
    private readonly exportCvPdfUseCase: ExportCvPdfUseCase,
  ) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Create a new CV' })
  async create(@GetMe('id') userId: string, @Body() dto: CreateCvDto) {
    const result = await this.createCvUseCase.execute(userId, {
      title: dto.title,
      summary: dto.summary,
      experiences: dto.experiences?.map((e) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
      })),
      educations: dto.educations?.map((e) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
      })),
      skills: dto.skills,
    });
    return ApiResponse.ok(result, 'CV created successfully');
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List all my CVs' })
  async listMyCvs(@GetMe('id') userId: string) {
    const result = await this.listMyCvsUseCase.execute(userId);
    return ApiResponse.ok(result, 'CVs retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CV by ID' })
  async getById(@Param('id') id: string) {
    const result = await this.getCvUseCase.execute(id);
    return ApiResponse.ok(result, 'CV retrieved successfully');
  }

  @Patch(':id')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Update CV' })
  async update(
    @GetMe('id') userId: string,
    @Param('id') cvId: string,
    @Body() dto: UpdateCvDto,
  ) {
    const result = await this.updateCvUseCase.execute(userId, cvId, {
      title: dto.title,
      summary: dto.summary,
      experiences: dto.experiences?.map((e) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
      })),
      educations: dto.educations?.map((e) => ({
        ...e,
        startDate: new Date(e.startDate),
        endDate: e.endDate ? new Date(e.endDate) : undefined,
      })),
      skills: dto.skills,
    });
    return ApiResponse.ok(result, 'CV updated successfully');
  }

  @Patch(':id/publish')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Publish CV' })
  async publish(@GetMe('id') userId: string, @Param('id') cvId: string) {
    const result = await this.publishCvUseCase.execute(userId, cvId);
    return ApiResponse.ok(result, 'CV published successfully');
  }

  @Delete(':id')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete CV (soft delete)' })
  async delete(@GetMe('id') userId: string, @Param('id') cvId: string) {
    await this.deleteCvUseCase.execute(userId, cvId);
  }

  @Post(':id/upload')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Upload a ready-made CV file (PDF/DOC/DOCX)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_CV_FILE_SIZE_BYTES } }))
  async uploadFile(
    @GetMe('id') userId: string,
    @Param('id') cvId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.uploadCvFileUseCase.execute(userId, cvId, file);
    return ApiResponse.ok(result, 'CV file uploaded successfully');
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export CV as PDF' })
  async exportPdf(@Param('id') cvId: string, @Res() res: Response) {
    const { buffer, fileName } = await this.exportCvPdfUseCase.execute(cvId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(buffer);
  }
}
