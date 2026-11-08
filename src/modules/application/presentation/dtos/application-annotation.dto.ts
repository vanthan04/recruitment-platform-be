import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { APPLICATION_NOTE_MAX_LENGTH } from '@/modules/application/domain/repositories/application-annotation.repository';

export class AddApplicationNoteDto {
  @ApiProperty({
    example: 'Vòng 1: nền tảng NestJS tốt, cần hỏi thêm về hệ thống phân tán.',
    maxLength: APPLICATION_NOTE_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(APPLICATION_NOTE_MAX_LENGTH)
  content: string;
}

export class SetApplicationStarredDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  starred: boolean;
}
