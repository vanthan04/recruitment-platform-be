import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class MonitorStartWsDto {
  @IsUUID()
  interviewId: string;

  /** Version of the notice the candidate was shown (e.g. "2026-11-09.v1"). */
  @IsString()
  @MaxLength(32)
  @Matches(/^[\w.-]+$/)
  noticeVersion: string;
}
