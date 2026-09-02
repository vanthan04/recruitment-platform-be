import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
export declare class CreateCompanyDto {
    name: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    industry?: string;
    size?: CompanySize;
    address?: string;
}
