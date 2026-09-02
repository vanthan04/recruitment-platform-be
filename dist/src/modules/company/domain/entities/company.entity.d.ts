import { BaseEntity } from '@/common/domain/base.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
export declare class Company extends BaseEntity {
    name: string;
    slug: string;
    logoUrl: string | null;
    description: string | null;
    website: string | null;
    industry: string | null;
    size: CompanySize | null;
    address: string | null;
    deletedAt: Date | null;
    ownerId: string;
    constructor(partial: Partial<Company>);
    ensureOwner(userId: string): void;
    softDelete(): void;
    get isDeleted(): boolean;
    updateDetails(data: {
        name?: string;
        logoUrl?: string | null;
        description?: string | null;
        website?: string | null;
        industry?: string | null;
        size?: CompanySize | null;
        address?: string | null;
    }): void;
}
