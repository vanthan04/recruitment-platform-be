import { MailerService } from '@nestjs-modules/mailer';
import { EmailOptions, IMailService } from '../domain/mail.service.interface';
export declare class NodemailerMailService implements IMailService {
    private readonly mailerService;
    constructor(mailerService: MailerService);
    sendEmail(options: EmailOptions): Promise<void>;
}
