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
exports.UpdateProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const gender_enum_1 = require("../../../../common/enums/gender.enum");
class UpdateProfileDto {
    fullName;
    phoneNumber;
    gender;
    birthDate;
    avatarUrl;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nguyễn Văn A' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '0123456789' }),
    (0, class_validator_1.IsPhoneNumber)('VN'),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: gender_enum_1.Gender, example: gender_enum_1.Gender.MALE }),
    (0, class_validator_1.IsEnum)(gender_enum_1.Gender),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1990-01-01' }),
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg' }),
    (0, class_validator_1.IsUrl)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
//# sourceMappingURL=update-profile.dto.js.map