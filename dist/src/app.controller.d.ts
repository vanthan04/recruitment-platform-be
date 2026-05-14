import { MailService } from '@/modules/mail/mail.service';
export declare class AppController {
    private readonly mailService;
    constructor(mailService: MailService);
    check(): import("./common/dtos/response.dto").ResponseDto<null>;
}
