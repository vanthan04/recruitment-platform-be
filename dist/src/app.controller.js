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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_response_1 = require("./common/dtos/api-response");
const mail_service_1 = require("@/modules/mail/mail.service");
let AppController = class AppController {
    mailService;
    constructor(mailService) {
        this.mailService = mailService;
    }
    check() {
        return api_response_1.ApiResponse.ok(null, 'Service is up and running in development mode');
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Service is up and running' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "check", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('app'),
    (0, common_1.Controller)('healthcheck'),
    __metadata("design:paramtypes", [typeof (_a = typeof mail_service_1.MailService !== "undefined" && mail_service_1.MailService) === "function" ? _a : Object])
], AppController);
//# sourceMappingURL=app.controller.js.map