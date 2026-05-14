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
exports.CreateCvDto = exports.CreateSkillDto = exports.CreateEducationDto = exports.CreateExperienceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateExperienceDto {
    company;
    position;
    description;
    startDate;
    endDate;
    isCurrent;
}
exports.CreateExperienceDto = CreateExperienceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Google' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateExperienceDto.prototype, "company", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Senior Software Engineer' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateExperienceDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Built distributed systems at scale' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateExperienceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2020-01-15' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateExperienceDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2023-06-30' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateExperienceDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateExperienceDto.prototype, "isCurrent", void 0);
class CreateEducationDto {
    school;
    degree;
    fieldOfStudy;
    description;
    startDate;
    endDate;
}
exports.CreateEducationDto = CreateEducationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MIT' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateEducationDto.prototype, "school", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Bachelor of Science' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateEducationDto.prototype, "degree", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Computer Science' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateEducationDto.prototype, "fieldOfStudy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Focused on AI/ML research' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateEducationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2016-09-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEducationDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2020-06-15' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateEducationDto.prototype, "endDate", void 0);
class CreateSkillDto {
    name;
    level;
}
exports.CreateSkillDto = CreateSkillDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TypeScript' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Advanced' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "level", void 0);
class CreateCvDto {
    title;
    summary;
    experiences;
    educations;
    skills;
}
exports.CreateCvDto = CreateCvDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Senior Backend Developer CV' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateCvDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Experienced engineer with 5+ years...' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateCvDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateExperienceDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateExperienceDto),
    __metadata("design:type", Array)
], CreateCvDto.prototype, "experiences", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateEducationDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateEducationDto),
    __metadata("design:type", Array)
], CreateCvDto.prototype, "educations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CreateSkillDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateSkillDto),
    __metadata("design:type", Array)
], CreateCvDto.prototype, "skills", void 0);
//# sourceMappingURL=create-cv.dto.js.map