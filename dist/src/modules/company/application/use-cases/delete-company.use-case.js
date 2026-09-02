"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCompanyUseCase = void 0;
const common_1 = require("@nestjs/common");
const company_repository_1 = require("../../domain/repositories/company.repository");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
let DeleteCompanyUseCase = class DeleteCompanyUseCase {
    companyRepository;
    constructor(companyRepository) {
        this.companyRepository = companyRepository;
    }
    async execute(ownerId, companyId) {
        const company = await this.companyRepository.findById(companyId);
        if (!company) {
            throw new domain_exception_1.EntityNotFoundException('Company', companyId);
        }
        company.ensureOwner(ownerId);
        company.softDelete();
        await this.companyRepository.update(company);
    }
};
exports.DeleteCompanyUseCase = DeleteCompanyUseCase;
exports.DeleteCompanyUseCase = DeleteCompanyUseCase = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [company_repository_1.ICompanyRepository])
], DeleteCompanyUseCase);
//# sourceMappingURL=delete-company.use-case.js.map