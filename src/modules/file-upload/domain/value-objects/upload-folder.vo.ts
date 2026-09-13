import { randomUUID } from 'crypto';

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

/**
 * Folders whose objects must never be reachable by a plain (unsigned) URL —
 * chat attachments can carry résumés/offer letters, so they're uploaded via
 * `uploadBuffer()` to a backend-generated key (like CVs) instead of the
 * public `upload()` path avatars/logos use, and only ever read back through
 * a short-lived signed URL (see MessageAttachmentUrlResolver in the chat
 * module). Add a folder here if it ever needs to carry non-public content.
 */
export const PRIVATE_UPLOAD_FOLDERS: ReadonlySet<UploadFolder> = new Set([
  UploadFolder.CHAT_ATTACHMENTS,
]);

export function isPrivateUploadFolder(folder: string): folder is UploadFolder {
  return PRIVATE_UPLOAD_FOLDERS.has(folder as UploadFolder);
}

const UUID_V4_WITH_EXT = '[0-9a-fA-F-]{36}\\.[A-Za-z0-9]+';

/**
 * True if `value` is exactly the shape `uploadPrivateFileKey()` produces for
 * `folder` — i.e. a key our own upload flow could have generated, not an
 * arbitrary client-supplied string reaching into another folder or outside
 * the storage key namespace entirely.
 */
export function isPrivateUploadKey(
  folder: UploadFolder,
  value: string,
): boolean {
  return new RegExp(`^${folder}/${UUID_V4_WITH_EXT}$`).test(value);
}

export function buildPrivateUploadKey(
  folder: UploadFolder,
  fileExtension: string,
): string {
  return `${folder}/${randomUUID()}${fileExtension}`;
}
