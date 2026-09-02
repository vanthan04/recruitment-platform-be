export class InterviewResponseDto {
  id: string;
  jobApplicationId: string;
  scheduledAt: Date;
  location: string | null;
  meetingLink: string | null;
  note: string | null;
  status: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
