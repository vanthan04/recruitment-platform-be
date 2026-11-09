export class InterviewResponseDto {
  id: string;
  jobApplicationId: string;
  scheduledAt: Date;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
  useRoom: boolean;
  note: string | null;
  status: string;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}
