export interface JobAlertMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export abstract class IMailPort {
  abstract sendEmail(options: JobAlertMailOptions): Promise<void>;
}
