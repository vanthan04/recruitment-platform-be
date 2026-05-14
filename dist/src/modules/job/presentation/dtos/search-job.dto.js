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
exports.SearchJobDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const job_type_vo_1 = require("../../domain/value-objects/job-type.vo");
const page_options_dto_1 = require("../../../../common/dtos/page-options.dto");
const class_transformer_1 = require("class-transformer");
class SearchJobDto extends page_options_dto_1.PageOptionsDto {
    keyword;
    location;
    jobType;
    salaryMin;
    salaryMax;
}
exports.SearchJobDto = SearchJobDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Node.js' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchJobDto.prototype, "keyword", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ho Chi Minh' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchJobDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: job_type_vo_1.JobType }),
    (0, class_validator_1.IsEnum)(job_type_vo_1.JobType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SearchJobDto.prototype, "jobType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1000 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SearchJobDto.prototype, "salaryMin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5000 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SearchJobDto.prototype, "salaryMax", void 0);
//# sourceMappingURL=search-job.dto.js.map