import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UploadFolder } from '@/modules/file-upload/domain/value-objects/upload-folder.vo';

/**
 * `folder` used to be read via a raw `@Body('folder')` primitive, which
 * bypasses the global ValidationPipe entirely (it only validates
 * class-validator DTOs) — any authenticated user could set it to an
 * arbitrary storage-key prefix. Routing it through this DTO closes that
 * and lets the controller resolve a per-folder MIME allowlist.
 */
export class UploadFileOptionsDto {
  @ApiProperty({ enum: UploadFolder, example: UploadFolder.AVATARS })
  @IsEnum(UploadFolder)
  folder: UploadFolder;
}
