import { IAuthMailServicePort, SendMailOptions } from '../../application/ports/auth-mail-service.port';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
export declare class AuthMailAdapter implements IAuthMailServicePort {
    private readonly mailService;
    constructor(mailService: IMailService);
    sendEmail(options: SendMailOptions): Promise<void>;
}
