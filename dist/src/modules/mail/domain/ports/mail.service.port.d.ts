export interface EmailOptions {
    to: string;
    subject: string;
    template?: string;
    context?: Record<string, any>;
    html?: string;
    text?: string;
}
export declare abstract class IMailService {
    abstract sendEmail(options: EmailOptions): Promise<void>;
}
