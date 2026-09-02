"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const notification_controller_1 = require("./presentation/controllers/notification.controller");
const notification_repository_1 = require("./domain/repositories/notification.repository");
const notification_infra_repository_1 = require("./infrastructure/repositories/notification.infra-repository");
const notification_prisma_repository_1 = require("./infrastructure/persistence/prisma/notification-prisma.repository");
const application_events_listener_1 = require("./infrastructure/listeners/application-events.listener");
const create_notification_use_case_1 = require("./application/use-cases/create-notification.use-case");
const list_my_notifications_use_case_1 = require("./application/use-cases/list-my-notifications.use-case");
const mark_as_read_use_case_1 = require("./application/use-cases/mark-as-read.use-case");
const mark_all_as_read_use_case_1 = require("./application/use-cases/mark-all-as-read.use-case");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        controllers: [notification_controller_1.NotificationController],
        providers: [
            notification_prisma_repository_1.NotificationPrismaRepository,
            {
                provide: notification_repository_1.INotificationRepository,
                useClass: notification_infra_repository_1.NotificationInfraRepository,
            },
            create_notification_use_case_1.CreateNotificationUseCase,
            list_my_notifications_use_case_1.ListMyNotificationsUseCase,
            mark_as_read_use_case_1.MarkAsReadUseCase,
            mark_all_as_read_use_case_1.MarkAllAsReadUseCase,
            application_events_listener_1.ApplicationEventsListener,
        ],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map