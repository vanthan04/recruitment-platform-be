"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Company = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class Company extends base_entity_1.BaseEntity {
    name;
    slug;
    logoUrl;
    description;
    website;
    industry;
    size;
    address;
    deletedAt;
    ownerId;
    constructor(partial) {
        super();
        Object.assign(this, partial);
        this.logoUrl = partial.logoUrl ?? null;
        this.description = partial.description ?? null;
        this.website = partial.website ?? null;
        this.industry = partial.industry ?? null;
        this.size = partial.size ?? null;
        this.address = partial.address ?? null;
        this.deletedAt = partial.deletedAt ?? null;
    }
    ensureOwner(userId) {
        if (this.ownerId !== userId) {
            throw new domain_exception_1.UnauthorizedDomainException('You are not the owner of this company');
        }
    }
    softDelete() {
        if (this.deletedAt) {
            throw new domain_exception_1.BusinessRuleViolationException('Company is already deleted');
        }
        this.deletedAt = new Date();
    }
    get isDeleted() {
        return this.deletedAt !== null;
    }
    updateDetails(data) {
        if (data.name)
            this.name = data.name;
        if (data.logoUrl !== undefined)
            this.logoUrl = data.logoUrl;
        if (data.description !== undefined)
            this.description = data.description;
        if (data.website !== undefined)
            this.website = data.website;
        if (data.industry !== undefined)
            this.industry = data.industry;
        if (data.size !== undefined)
            this.size = data.size;
        if (data.address !== undefined)
            this.address = data.address;
    }
}
exports.Company = Company;
//# sourceMappingURL=company.entity.js.map