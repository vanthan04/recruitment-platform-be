import { Module } from '@nestjs/common';
import { CompanyController } from '@/modules/company/presentation/controllers/company.controller';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyInfraRepository } from '@/modules/company/infrastructure/repositories/company.infra-repository';
import { CompanyPrismaRepository } from '@/modules/company/infrastructure/persistence/prisma/company-prisma.repository';
import { UserModule } from '@/modules/user/user.module';
import { JobModule } from '@/modules/job/job.module';

// Use Cases
import { CreateCompanyUseCase } from '@/modules/company/application/use-cases/create-company.use-case';
import { UpdateCompanyUseCase } from '@/modules/company/application/use-cases/update-company.use-case';
import { GetCompanyUseCase } from '@/modules/company/application/use-cases/get-company.use-case';
import { ListCompaniesUseCase } from '@/modules/company/application/use-cases/list-companies.use-case';
import { DeleteCompanyUseCase } from '@/modules/company/application/use-cases/delete-company.use-case';

@Module({
  imports: [UserModule, JobModule],
  controllers: [CompanyController],
  providers: [
    CompanyPrismaRepository,
    {
      provide: ICompanyRepository,
      useClass: CompanyInfraRepository,
    },
    CreateCompanyUseCase,
    UpdateCompanyUseCase,
    GetCompanyUseCase,
    ListCompaniesUseCase,
    DeleteCompanyUseCase,
  ],
  exports: [ICompanyRepository],
})
export class CompanyModule {}
