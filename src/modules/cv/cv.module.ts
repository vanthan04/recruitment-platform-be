import { Module } from '@nestjs/common';
import { CvController } from '@/modules/cv/presentation/controllers/cv.controller';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvInfraRepository } from '@/modules/cv/infrastructure/repositories/cv.infra-repository';
import { CvPrismaRepository } from '@/modules/cv/infrastructure/persistence/prisma/cv-prisma.repository';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';

// Use Cases
import { CreateCvUseCase } from '@/modules/cv/application/use-cases/create-cv.use-case';
import { UpdateCvUseCase } from '@/modules/cv/application/use-cases/update-cv.use-case';
import { PublishCvUseCase } from '@/modules/cv/application/use-cases/publish-cv.use-case';
import { GetCvUseCase } from '@/modules/cv/application/use-cases/get-cv.use-case';
import { ListMyCvsUseCase } from '@/modules/cv/application/use-cases/list-my-cvs.use-case';
import { DeleteCvUseCase } from '@/modules/cv/application/use-cases/delete-cv.use-case';
import { UploadCvFileUseCase } from '@/modules/cv/application/use-cases/upload-cv-file.use-case';
import { ExportCvPdfUseCase } from '@/modules/cv/application/use-cases/export-cv-pdf.use-case';

@Module({
  imports: [FileUploadModule],
  controllers: [CvController],
  providers: [
    // Persistence
    CvPrismaRepository,
    {
      provide: ICvRepository,
      useClass: CvInfraRepository,
    },
    // Use Cases
    CreateCvUseCase,
    UpdateCvUseCase,
    PublishCvUseCase,
    GetCvUseCase,
    ListMyCvsUseCase,
    DeleteCvUseCase,
    UploadCvFileUseCase,
    ExportCvPdfUseCase,
  ],
  exports: [ICvRepository],
})
export class CvModule {}
