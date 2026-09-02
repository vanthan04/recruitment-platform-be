import { Injectable } from '@nestjs/common';
import {
  IInterviewMailPort,
  InterviewMailOptions,
} from '@/modules/interview/application/ports/mail.port';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';

@Injectable()
export class InterviewMailAdapter implements IInterviewMailPort {
  constructor(private readonly mailService: IMailService) {}

  async sendEmail(options: InterviewMailOptions): Promise<void> {
    await this.mailService.sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}
