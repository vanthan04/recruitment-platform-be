import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

/**
 * Maps Company domain entity to response DTO.
 */
export class CompanyResponseMapper {
  static toDto(company: Company): CompanyResponseDto {
    const dto = new CompanyResponseDto();
    dto.id = company.id;
    dto.name = company.name;
    dto.slug = company.slug;
    dto.logoUrl = company.logoUrl;
    dto.description = company.description;
    dto.website = company.website;
    dto.industry = company.industry;
    dto.size = company.size;
    dto.address = company.address;
    dto.ownerId = company.ownerId;
    dto.createdAt = company.createdAt;
    dto.updatedAt = company.updatedAt;
    return dto;
  }

  static toDtoList(companies: Company[]): CompanyResponseDto[] {
    return companies.map(CompanyResponseMapper.toDto);
  }
}
