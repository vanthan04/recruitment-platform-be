import { IsUUID } from 'class-validator';

export class RoomJoinWsDto {
  @IsUUID()
  interviewId: string;
}
