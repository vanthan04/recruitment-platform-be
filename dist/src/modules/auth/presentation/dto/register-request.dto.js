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
exports.RegisterRequestDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterRequestDto {
    email;
    password;
    fullName;
}
exports.RegisterRequestDto = RegisterRequestDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'EMAIL_IS_INVALID' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'EMAIL_IS_REQUIRED' }),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'PASSWORD_IS_REQUIRED' }),
    (0, class_validator_1.MinLength)(6, { message: 'PASSWORD_MIN_LENGTH' }),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'FULLNAME_IS_REQUIRED' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterRequestDto.prototype, "fullName", void 0);
//# sourceMappingURL=register-request.dto.js.map