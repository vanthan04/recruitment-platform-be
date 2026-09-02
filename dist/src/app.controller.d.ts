import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
export declare class AppController {
    private readonly mailService;
    constructor(mailService: IMailService);
    check(): import("./common/dtos/response.dto").ResponseDto<null>;
}
