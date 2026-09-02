import { Company } from '@/modules/company/domain/entities/company.entity';
export declare class CompanyMapper {
    static toDomain(raw: any): Company | null;
    static toPersistence(company: Company): any;
}
