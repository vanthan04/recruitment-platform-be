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
exports.UpdateCvDto = exports.UpdateSkillDto = exports.UpdateEducationDto = exports.UpdateExperienceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpdateExperienceDto {
    id;
    company;
    position;
    description;
    startDate;
    endDate;
    isCurrent;
}
exports.UpdateExperienceDto = UpdateExperienceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID for existing experience (omit for new)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateExperienceDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Google' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateExperienceDto.prototype, "company", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Senior Software Engineer' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateExperienceDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Built distributed systems at scale' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateExperienceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2020-01-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateExperienceDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2023-06-30' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateExperienceDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateExperienceDto.prototype, "isCurrent", void 0);
class UpdateEducationDto {
    id;
    school;
    degree;
    fieldOfStudy;
    description;
    startDate;
    endDate;
}
exports.UpdateEducationDto = UpdateEducationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID for existing education (omit for new)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'MIT' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "school", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Bachelor of Science' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "degree", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Computer Science' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "fieldOfStudy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Focused on AI/ML research' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2016-09-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2020-06-15' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateEducationDto.prototype, "endDate", void 0);
class UpdateSkillDto {
    id;
    name;
    level;
}
exports.UpdateSkillDto = UpdateSkillDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID for existing skill (omit for new)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'TypeScript' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Advanced' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "level", void 0);
class UpdateCvDto {
    title;
    summary;
    experiences;
    educations;
    skills;
}
exports.UpdateCvDto = UpdateCvDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated CV Title' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], UpdateCvDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Updated summary...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], UpdateCvDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [UpdateExperienceDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateExperienceDto),
    __metadata("design:type", Array)
], UpdateCvDto.prototype, "experiences", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [UpdateEducationDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateEducationDto),
    __metadata("design:type", Array)
], UpdateCvDto.prototype, "educations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [UpdateSkillDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateSkillDto),
    __metadata("design:type", Array)
], UpdateCvDto.prototype, "skills", void 0);
//# sourceMappingURL=update-cv.dto.js.map