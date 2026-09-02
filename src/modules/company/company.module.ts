import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CompanyController } from '@/modules/company/presentation/controllers/company.controller';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyInfraRepository } from '@/modules/company/infrastructure/repositories/company.infra-repository';
import { CompanyPrismaRepository } from '@/modules/company/infrastructure/persistence/prisma/company-prisma.repository';
import { UserModule } from '@/modules/user/user.module';
import { IUserCompanyLinkPort } from '@/modules/company/application/ports/user-company-link.port';
import { UserCompanyLinkAdapter } from '@/modules/company/infrastructure/adapters/user-company-link.adapter';

import { CreateCompanyHandler } from '@/modules/company/application/commands/create-company.command';
import { UpdateCompanyHandler } from '@/modules/company/application/commands/update-company.command';
import { DeleteCompanyHandler } from '@/modules/company/application/commands/delete-company.command';
import { GetCompanyHandler } from '@/modules/company/application/queries/get-company.query';
import { ListCompaniesHandler } from '@/modules/company/application/queries/list-companies.query';

@Module({
  imports: [CqrsModule, UserModule],
  controllers: [CompanyController],
  providers: [
    CompanyPrismaRepository,
    {
      provide: ICompanyRepository,
      useClass: CompanyInfraRepository,
    },
    {
      provide: IUserCompanyLinkPort,
      useClass: UserCompanyLinkAdapter,
    },
    CreateCompanyHandler,
    UpdateCompanyHandler,
    DeleteCompanyHandler,
    GetCompanyHandler,
    ListCompaniesHandler,
  ],
  exports: [ICompanyRepository],
})
export class CompanyModule {}
