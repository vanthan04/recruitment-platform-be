export interface SendMailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
export declare abstract class IAuthMailServicePort {
    abstract sendEmail(options: SendMailOptions): Promise<void>;
}
