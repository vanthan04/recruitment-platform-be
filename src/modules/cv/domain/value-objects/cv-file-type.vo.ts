/**
 * CV file type value object.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export enum CvFileType {
  PDF = 'PDF',
  DOC = 'DOC',
  DOCX = 'DOCX',
}

export const CV_ALLOWED_MIME_TYPES: Record<string, CvFileType> = {
  'application/pdf': CvFileType.PDF,
  'application/msword': CvFileType.DOC,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    CvFileType.DOCX,
};

export const CV_FILE_EXTENSIONS: Record<CvFileType, string> = {
  [CvFileType.PDF]: 'pdf',
  [CvFileType.DOC]: 'doc',
  [CvFileType.DOCX]: 'docx',
};
