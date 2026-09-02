import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class DeleteCompanyCommand {
  constructor(
    public readonly ownerId: string,
    public readonly companyId: string,
  ) {}
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
      throw new EntityNotFoundException('Company', companyId);
    }

    company.ensureOwner(ownerId);
    company.softDelete();

    await this.companyRepository.update(company);
  }
}
