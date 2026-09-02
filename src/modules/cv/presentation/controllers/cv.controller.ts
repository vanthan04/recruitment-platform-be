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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateCvCommand } from '@/modules/cv/application/commands/create-cv.command';
import { UpdateCvCommand } from '@/modules/cv/application/commands/update-cv.command';
import { DeleteCvCommand } from '@/modules/cv/application/commands/delete-cv.command';
import { PublishCvCommand } from '@/modules/cv/application/commands/publish-cv.command';
import { UploadCvFileCommand } from '@/modules/cv/application/commands/upload-cv-file.command';
import { GetCvQuery } from '@/modules/cv/application/queries/get-cv.query';
import { ListMyCvsQuery } from '@/modules/cv/application/queries/list-my-cvs.query';
import { ExportCvPdfQuery } from '@/modules/cv/application/queries/export-cv-pdf.query';

import { CreateCvDto } from '@/modules/cv/presentation/dtos/create-cv.dto';
import { UpdateCvDto } from '@/modules/cv/presentation/dtos/update-cv.dto';

const MAX_CV_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

@ApiTags('cvs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cvs')
export class CvController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Create a new CV' })
  async create(@GetMe('id') userId: string, @Body() dto: CreateCvDto) {
    const result = await this.commandBus.execute(
      new CreateCvCommand(userId, {
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
      }),
    );
    return ApiResponse.ok(result, 'CV created successfully');
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List all my CVs' })
  async listMyCvs(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(new ListMyCvsQuery(userId));
    return ApiResponse.ok(result, 'CVs retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CV by ID' })
  async getById(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetCvQuery(id));
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
    const result = await this.commandBus.execute(
      new UpdateCvCommand(userId, cvId, {
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
      }),
    );
    return ApiResponse.ok(result, 'CV updated successfully');
  }

  @Patch(':id/publish')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Publish CV' })
  async publish(@GetMe('id') userId: string, @Param('id') cvId: string) {
    const result = await this.commandBus.execute(new PublishCvCommand(userId, cvId));
    return ApiResponse.ok(result, 'CV published successfully');
  }

  @Delete(':id')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete CV (soft delete)' })
  async delete(@GetMe('id') userId: string, @Param('id') cvId: string) {
    await this.commandBus.execute(new DeleteCvCommand(userId, cvId));
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
    const result = await this.commandBus.execute(new UploadCvFileCommand(userId, cvId, file));
    return ApiResponse.ok(result, 'CV file uploaded successfully');
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export CV as PDF' })
  async exportPdf(@Param('id') cvId: string, @Res() res: Response) {
    const { buffer, fileName } = await this.queryBus.execute(new ExportCvPdfQuery(cvId));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    res.send(buffer);
  }
}
