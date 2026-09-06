import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanyNotFoundException } from '@/modules/company/domain/exceptions/company.exceptions';

export class DeleteCompanyCommand extends Command<void> {
  constructor(
    public readonly ownerId: string,
    public readonly companyId: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(DeleteCompanyCommand)
export class DeleteCompanyHandler implements ICommandHandler<
  DeleteCompanyCommand,
  void
> {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute({ ownerId, companyId }: DeleteCompanyCommand): Promise<void> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    company.ensureOwner(ownerId);
    company.softDelete();

    await this.companyRepository.update(company);
  }
}
