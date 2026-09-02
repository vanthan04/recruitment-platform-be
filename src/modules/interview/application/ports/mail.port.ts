export interface InterviewMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export abstract class IInterviewMailPort {
  abstract sendEmail(options: InterviewMailOptions): Promise<void>;
}
