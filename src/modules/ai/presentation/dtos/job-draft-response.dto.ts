import { ApiProperty } from '@nestjs/swagger';

export class JobDraftResponseDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: [String] })
  requirements: string[];

  @ApiProperty({ type: [String] })
  benefits: string[];
}
