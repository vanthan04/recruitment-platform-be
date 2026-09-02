import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CvController } from '@/modules/cv/presentation/controllers/cv.controller';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvInfraRepository } from '@/modules/cv/infrastructure/repositories/cv.infra-repository';
import { CvPrismaRepository } from '@/modules/cv/infrastructure/persistence/prisma/cv-prisma.repository';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { IFileUploadPort } from '@/modules/cv/application/ports/file-upload.port';
import { CvFileUploadAdapter } from '@/modules/cv/infrastructure/adapters/file-upload.adapter';

import { CreateCvHandler } from '@/modules/cv/application/commands/create-cv.command';
import { UpdateCvHandler } from '@/modules/cv/application/commands/update-cv.command';
import { DeleteCvHandler } from '@/modules/cv/application/commands/delete-cv.command';
import { PublishCvHandler } from '@/modules/cv/application/commands/publish-cv.command';
import { UploadCvFileHandler } from '@/modules/cv/application/commands/upload-cv-file.command';
import { GetCvHandler } from '@/modules/cv/application/queries/get-cv.query';
import { ListMyCvsHandler } from '@/modules/cv/application/queries/list-my-cvs.query';
import { ExportCvPdfHandler } from '@/modules/cv/application/queries/export-cv-pdf.query';

@Module({
  imports: [CqrsModule, FileUploadModule],
  controllers: [CvController],
  providers: [
    CvPrismaRepository,
    {
      provide: ICvRepository,
      useClass: CvInfraRepository,
    },
    {
      provide: IFileUploadPort,
      useClass: CvFileUploadAdapter,
    },
    CreateCvHandler,
    UpdateCvHandler,
    DeleteCvHandler,
    PublishCvHandler,
    UploadCvFileHandler,
    GetCvHandler,
    ListMyCvsHandler,
    ExportCvPdfHandler,
  ],
  exports: [ICvRepository],
})
export class CvModule {}
