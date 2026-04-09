import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IMailService } from './domain/ports/mail.service.port';
import { NodemailerMailProvider } from './infrastructure/providers/nodemailer-mail.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IMailService,
      useClass: NodemailerMailProvider,
    },
  ],
  exports: [IMailService],
})
export class MailModule {}
