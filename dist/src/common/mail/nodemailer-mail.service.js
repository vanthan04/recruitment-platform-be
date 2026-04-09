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
exports.NodemailerMailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let NodemailerMailService = class NodemailerMailService {
    mailerService;
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendEmail(options) {
        await this.mailerService.sendMail({
            to: options.to,
            subject: options.subject,
            template: options.template,
            context: options.context,
            html: options.html,
            text: options.text,
        });
    }
};
exports.NodemailerMailService = NodemailerMailService;
exports.NodemailerMailService = NodemailerMailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], NodemailerMailService);
//# sourceMappingURL=nodemailer-mail.service.js.map