"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseDto = void 0;
class ResponseDto {
    success;
    message;
    code;
    data;
    metadata;
    timestamp;
    constructor(partial) {
        Object.assign(this, partial);
        this.timestamp = new Date().toISOString();
    }
}
exports.ResponseDto = ResponseDto;
//# sourceMappingURL=response.dto.js.map