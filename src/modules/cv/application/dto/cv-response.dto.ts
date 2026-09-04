/**
 * CV Response DTO — Application layer output.
 * Decoupled from domain entity. Used by controllers as response format.
 * Intentionally omits `fileKey` — the frontend never needs the raw S3
 * object key, only the presigned download URL from `GET /cvs/:id/download`.
 */
export class CvResponseDto {
  id: string;
  title: string;
  originalName: string;
  fileType: string;
  mimeType: string;
  fileSize: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}
