"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationResponseMapper = void 0;
const application_response_dto_1 = require("../dto/application-response.dto");
class ApplicationResponseMapper {
    static toDto(app) {
        const dto = new application_response_dto_1.ApplicationResponseDto();
        dto.id = app.id;
        dto.status = app.status;
        dto.coverLetter = app.coverLetter;
        dto.userId = app.userId;
        dto.jobId = app.jobId;
        dto.cvId = app.cvId;
        dto.createdAt = app.createdAt;
        dto.updatedAt = app.updatedAt;
        return dto;
    }
    static toDtoList(apps) {
        return apps.map(ApplicationResponseMapper.toDto);
    }
}
exports.ApplicationResponseMapper = ApplicationResponseMapper;
//# sourceMappingURL=application-response.mapper.js.map