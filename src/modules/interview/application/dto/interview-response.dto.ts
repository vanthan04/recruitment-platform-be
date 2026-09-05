export class InterviewResponseDto {
  id: string;
  jobApplicationId: string;
  scheduledAt: Date;
  durationMinutes: number | null;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
