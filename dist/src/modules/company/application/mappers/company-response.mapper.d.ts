import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';
export declare class CompanyResponseMapper {
    static toDto(company: Company): CompanyResponseDto;
    static toDtoList(companies: Company[]): CompanyResponseDto[];
}
