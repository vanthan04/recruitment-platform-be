import { ConfigService } from '@nestjs/config';
import { IMailService, EmailOptions } from '../../domain/ports/mail.service.port';
export declare class NodemailerMailProvider implements IMailService {
    private readonly configService;
    private transporter;
    constructor(configService: ConfigService);
    sendEmail(options: EmailOptions): Promise<void>;
}
