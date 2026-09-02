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
exports.ApplicationEventsListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const create_notification_use_case_1 = require("../../application/use-cases/create-notification.use-case");
const notification_type_vo_1 = require("../../domain/value-objects/notification-type.vo");
const job_applied_event_1 = require("../../../application/infrastructure/events/job-applied.event");
const application_status_changed_event_1 = require("../../../application/infrastructure/events/application-status-changed.event");
let ApplicationEventsListener = class ApplicationEventsListener {
    createNotificationUseCase;
    constructor(createNotificationUseCase) {
        this.createNotificationUseCase = createNotificationUseCase;
    }
    async handleJobApplied(event) {
        await this.createNotificationUseCase.execute({
            userId: event.recruiterId,
            type: notification_type_vo_1.NotificationType.NEW_APPLICATION,
            title: 'New job application',
            message: `You have a new application for "${event.jobTitle}"`,
            metadata: { applicationId: event.applicationId, jobId: event.jobId },
        });
    }
    async handleApplicationStatusChanged(event) {
        await this.createNotificationUseCase.execute({
            userId: event.candidateId,
            type: notification_type_vo_1.NotificationType.APPLICATION_STATUS_CHANGED,
            title: 'Application status updated',
            message: `Your application for "${event.jobTitle}" is now ${event.status}`,
            metadata: { applicationId: event.applicationId, jobId: event.jobId, status: event.status },
        });
    }
};
exports.ApplicationEventsListener = ApplicationEventsListener;
__decorate([
    (0, event_emitter_1.OnEvent)(job_applied_event_1.JOB_APPLIED_EVENT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [job_applied_event_1.JobAppliedEvent]),
    __metadata("design:returntype", Promise)
], ApplicationEventsListener.prototype, "handleJobApplied", null);
__decorate([
    (0, event_emitter_1.OnEvent)(application_status_changed_event_1.APPLICATION_STATUS_CHANGED_EVENT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [application_status_changed_event_1.ApplicationStatusChangedEvent]),
    __metadata("design:returntype", Promise)
], ApplicationEventsListener.prototype, "handleApplicationStatusChanged", null);
exports.ApplicationEventsListener = ApplicationEventsListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [create_notification_use_case_1.CreateNotificationUseCase])
], ApplicationEventsListener);
//# sourceMappingURL=application-events.listener.js.map