export class MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  createdAt: Date;

  constructor(partial: Partial<MessageAttachment>) {
    Object.assign(this, partial);
    this.createdAt = partial.createdAt ?? new Date();
  }
}
