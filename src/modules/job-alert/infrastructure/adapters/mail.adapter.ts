import { Injectable } from '@nestjs/common';
import {
  IMailPort,
  JobAlertMailOptions,
} from '@/modules/job-alert/application/ports/mail.port';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';

@Injectable()
export class MailAdapter implements IMailPort {
  constructor(private readonly mailService: IMailService) {}

  async sendEmail(options: JobAlertMailOptions): Promise<void> {
    await this.mailService.sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
