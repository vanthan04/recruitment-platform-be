import { CompanyLookupAdapter } from './company-lookup.adapter';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { Company } from '@/modules/company/domain/entities/company.entity';

describe('CompanyLookupAdapter', () => {
  it('batches all requested ids into a single findManyByIds call', async () => {
    const companyRepository: jest.Mocked<Pick<ICompanyRepository, 'findManyByIds'>> = {
      findManyByIds: jest.fn().mockResolvedValue([
        new Company({
          id: 'company-1',
          name: 'Acme',
          slug: 'acme',
          logoUrl: 'https://cdn/acme.png',
          ownerId: 'owner-1',
        }),
      ]),
    };
    const adapter = new CompanyLookupAdapter(companyRepository as any);

    const result = await adapter.findManyByIds([
      'company-1',
      'company-1',
      'company-2',
    ]);

    expect(companyRepository.findManyByIds).toHaveBeenCalledTimes(1);
    expect(companyRepository.findManyByIds).toHaveBeenCalledWith([
      'company-1',
      'company-2',
    ]);
    expect(result.get('company-1')).toEqual({
      id: 'company-1',
      name: 'Acme',
      logoUrl: 'https://cdn/acme.png',
    });
    expect(result.has('company-2')).toBe(false);
  });
});
