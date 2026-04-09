export interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
  text?: string;
}

export abstract class IMailService {
  abstract sendEmail(options: EmailOptions): Promise<void>;
}
