import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyType } from '@/modules/company/domain/value-objects/company-type.vo';
import {
  CompanyOwnershipException,
  CompanyAlreadyDeletedException,
} from '@/modules/company/domain/exceptions/company.exceptions';

function makeCompany(overrides: Partial<Company> = {}): Company {
  return new Company({
    name: 'Acme Inc',
    slug: 'acme-inc',
    ownerId: 'owner-1',
    ...overrides,
  });
}

describe('Company entity', () => {
  describe('constructor', () => {
    it('defaults optional fields to null', () => {
      const company = makeCompany();

      expect(company.logoUrl).toBeNull();
      expect(company.description).toBeNull();
      expect(company.website).toBeNull();
      expect(company.size).toBeNull();
      expect(company.companyType).toBeNull();
      expect(company.address).toBeNull();
      expect(company.province).toBeNull();
      expect(company.ward).toBeNull();
      expect(company.deletedAt).toBeNull();
    });
  });

  describe('ensureOwner', () => {
    it('does not throw when the given user is the owner', () => {
      const company = makeCompany({ ownerId: 'owner-1' });
      expect(() => company.ensureOwner('owner-1')).not.toThrow();
    });

    it('throws CompanyOwnershipException when the given user is not the owner', () => {
      const company = makeCompany({ ownerId: 'owner-1' });
      expect(() => company.ensureOwner('someone-else')).toThrow(
        CompanyOwnershipException,
      );
    });
  });

  describe('softDelete', () => {
    it('sets deletedAt and flips isDeleted', () => {
      const company = makeCompany();
      expect(company.isDeleted).toBe(false);

      company.softDelete();

      expect(company.isDeleted).toBe(true);
      expect(company.deletedAt).toBeInstanceOf(Date);
    });

    it('throws CompanyAlreadyDeletedException when already deleted', () => {
      const company = makeCompany({ deletedAt: new Date() });
      expect(() => company.softDelete()).toThrow(
        CompanyAlreadyDeletedException,
      );
    });
  });

  describe('updateDetails', () => {
    it('only overwrites fields that are present in the patch', () => {
      const company = makeCompany({
        name: 'Old Name',
        address: '123 Main St',
      });

      company.updateDetails({ name: 'New Name' });

      expect(company.name).toBe('New Name');
      expect(company.address).toBe('123 Main St');
    });

    it('allows explicitly clearing a nullable field with null', () => {
      const company = makeCompany({ description: 'Old description' });

      company.updateDetails({ description: null });

      expect(company.description).toBeNull();
    });

    it('ignores an empty-string name (falsy) and keeps the previous value', () => {
      const company = makeCompany({ name: 'Old Name' });

      company.updateDetails({ name: '' });

      expect(company.name).toBe('Old Name');
    });

    it('updates size', () => {
      const company = makeCompany({ size: CompanySize.SIZE_1_10 });

      company.updateDetails({ size: CompanySize.SIZE_500_PLUS });

      expect(company.size).toBe(CompanySize.SIZE_500_PLUS);
    });

    it('updates companyType, province, and ward', () => {
      const company = makeCompany();

      company.updateDetails({
        companyType: CompanyType.OUTSOURCING,
        province: 'Ho Chi Minh City',
        ward: 'Ben Nghe Ward',
      });

      expect(company.companyType).toBe(CompanyType.OUTSOURCING);
      expect(company.province).toBe('Ho Chi Minh City');
      expect(company.ward).toBe('Ben Nghe Ward');
    });
  });
});
