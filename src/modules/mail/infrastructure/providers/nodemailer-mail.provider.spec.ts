import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NodemailerMailProvider } from '@/modules/mail/infrastructure/providers/nodemailer-mail.provider';

jest.mock('nodemailer');

describe('NodemailerMailProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let sendMail: jest.Mock;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const config: Record<string, unknown> = {
      MAIL_HOST: 'smtp.example.com',
      MAIL_PORT: 587,
      MAIL_USER: 'user@example.com',
      MAIL_PASS: 'app-password',
      MAIL_FROM: 'no-reply@example.com',
    };
    configService = {
      get: jest.fn((key: string) => config[key]),
    } as any;
  });

  it('creates the SMTP transport from ConfigService values', () => {
    new NodemailerMailProvider(configService);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'user@example.com', pass: 'app-password' },
      }),
    );
  });

  it('sends the email through the transporter using MAIL_FROM as the sender', async () => {
    const provider = new NodemailerMailProvider(configService);

    await provider.sendEmail({
      to: 'candidate@example.com',
      subject: 'Welcome',
      text: 'Hello there',
      html: '<p>Hello there</p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'candidate@example.com',
      subject: 'Welcome',
      text: 'Hello there',
      html: '<p>Hello there</p>',
    });
  });
});
