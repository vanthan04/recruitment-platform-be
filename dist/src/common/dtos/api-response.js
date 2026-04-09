"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
const response_dto_1 = require("./response.dto");
class ApiResponse {
    _success = true;
    _message = '';
    _data;
    _metadata;
    success(ok) {
        this._success = ok;
        return this;
    }
    message(msg) {
        this._message = msg;
        return this;
    }
    data(payload) {
        const next = new ApiResponse();
        next._success = this._success;
        next._message = this._message;
        next._metadata = this._metadata;
        next._data = payload;
        return next;
    }
    metadata(meta) {
        this._metadata = meta;
        return this;
    }
    build() {
        return new response_dto_1.ResponseDto({
            success: this._success,
            message: this._message,
            data: this._data,
            metadata: this._metadata,
        });
    }
    static ok(data, message = '', metadata) {
        return new ApiResponse()
            .success(true)
            .message(message)
            .metadata(metadata)
            .data(data)
            .build();
    }
    static fail(message, data, metadata) {
        return new ApiResponse()
            .success(false)
            .message(message)
            .metadata(metadata)
            .data(data)
            .build();
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.js.map