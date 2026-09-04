import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CvController } from '@/modules/cv/presentation/controllers/cv.controller';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvInfraRepository } from '@/modules/cv/infrastructure/repositories/cv.infra-repository';
import { CvPrismaRepository } from '@/modules/cv/infrastructure/persistence/prisma/cv-prisma.repository';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import { CvStorageAdapter } from '@/modules/cv/infrastructure/adapters/cv-storage.adapter';

import { CreateCvHandler } from '@/modules/cv/application/commands/create-cv.command';
import { UpdateCvHandler } from '@/modules/cv/application/commands/update-cv.command';
import { DeleteCvHandler } from '@/modules/cv/application/commands/delete-cv.command';
import { PublishCvHandler } from '@/modules/cv/application/commands/publish-cv.command';
import { GetCvHandler } from '@/modules/cv/application/queries/get-cv.query';
import { ListMyCvsHandler } from '@/modules/cv/application/queries/list-my-cvs.query';
import { DownloadCvHandler } from '@/modules/cv/application/queries/download-cv.query';

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
      provide: ICvStoragePort,
      useClass: CvStorageAdapter,
    },
    CreateCvHandler,
    UpdateCvHandler,
    DeleteCvHandler,
    PublishCvHandler,
    GetCvHandler,
    ListMyCvsHandler,
    DownloadCvHandler,
  ],
  exports: [ICvRepository],
})
export class CvModule {}
