"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailModule = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const config_1 = require("@nestjs/config");
const mail_service_interface_1 = require("../domain/mail.service.interface");
const nodemailer_mail_service_1 = require("./nodemailer-mail.service");
let MailModule = class MailModule {
};
exports.MailModule = MailModule;
exports.MailModule = MailModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            mailer_1.MailerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (config) => ({
                    transport: {
                        host: config.get('MAIL_HOST'),
                        secure: config.get('MAIL_SECURE') === 'true',
                        auth: {
                            user: config.get('MAIL_USER'),
                            pass: config.get('MAIL_PASS'),
                        },
                    },
                    defaults: {
                        from: `"No Reply" <${config.get('MAIL_FROM')}>`,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            {
                provide: mail_service_interface_1.IMailService,
                useClass: nodemailer_mail_service_1.NodemailerMailService,
            },
        ],
        exports: [mail_service_interface_1.IMailService],
    })
], MailModule);
//# sourceMappingURL=mail.module.js.map