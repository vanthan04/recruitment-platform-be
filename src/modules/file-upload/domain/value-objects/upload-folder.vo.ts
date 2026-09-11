/**
 * The only folders any client actually uploads to (verified against every
 * caller in both this repo and recruitment-platform-fe) — enumerated rather
 * than left as a free-form string so the endpoint can apply a per-folder
 * MIME allowlist and so `@IsEnum` can validate it via the global
 * ValidationPipe instead of accepting an unchecked `@Body('folder')` value.
 */
export enum UploadFolder {
  AVATARS = 'avatars',
  COMPANY_LOGOS = 'company-logos',
  CHAT_ATTACHMENTS = 'chat-attachments',
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Per-folder MIME allowlist. `chat-attachments` is the one folder that
 * carries documents (résumés, offer letters, ...) rather than only
 * images — avatars and company logos stay image-only.
 */
export const ALLOWED_MIME_TYPES_BY_FOLDER: Record<UploadFolder, string[]> = {
  [UploadFolder.AVATARS]: IMAGE_MIME_TYPES,
  [UploadFolder.COMPANY_LOGOS]: IMAGE_MIME_TYPES,
  [UploadFolder.CHAT_ATTACHMENTS]: [
    ...IMAGE_MIME_TYPES,
    ...DOCUMENT_MIME_TYPES,
  ],
};
