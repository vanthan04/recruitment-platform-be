import { Injectable } from '@nestjs/common';
import {
  IAuthMailServicePort,
  SendMailOptions,
} from '../../application/ports/auth-mail-service.port';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';

@Injectable()
export class AuthMailAdapter implements IAuthMailServicePort {
  constructor(private readonly mailService: IMailService) {}

  async sendEmail(options: SendMailOptions): Promise<void> {
    await this.mailService.sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
