"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const api_response_1 = require("../dtos/api-response");
const domain_exception_1 = require("../exceptions/domain.exception");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_SERVER_ERROR';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const res = exception.getResponse();
            message = typeof res === 'object' ? res.message : res;
            code = 'HTTP_ERROR';
            if (status === common_1.HttpStatus.BAD_REQUEST && Array.isArray(message)) {
                message = message.join(', ');
                code = 'VALIDATION_ERROR';
            }
        }
        else if (exception instanceof domain_exception_1.DomainException) {
            status = this.mapDomainExceptionToStatus(exception);
            message = exception.message;
            code = exception.code;
        }
        else {
            this.logger.error(exception);
            if (exception.message) {
                message = exception.message;
            }
        }
        response.status(status).json(api_response_1.ApiResponse.fail(message, code));
    }
    mapDomainExceptionToStatus(exception) {
        if (exception instanceof domain_exception_1.EntityNotFoundException) {
            return common_1.HttpStatus.NOT_FOUND;
        }
        if (exception instanceof domain_exception_1.UnauthorizedDomainException) {
            return common_1.HttpStatus.FORBIDDEN;
        }
        if (exception instanceof domain_exception_1.DuplicateEntityException) {
            return common_1.HttpStatus.CONFLICT;
        }
        if (exception instanceof domain_exception_1.BusinessRuleViolationException) {
            return common_1.HttpStatus.BAD_REQUEST;
        }
        return common_1.HttpStatus.BAD_REQUEST;
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map