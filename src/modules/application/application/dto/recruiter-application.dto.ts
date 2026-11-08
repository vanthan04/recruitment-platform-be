import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

/**
 * An application as its job's recruiter sees it: the shared shape plus the
 * recruiter-private star. Only ListApplicationsByJobHandler (recruiter-only,
 * owner-checked) produces it; candidate-facing responses use plain
 * ApplicationResponseDto, which has no such field.
 */
export type RecruiterApplicationDto = ApplicationResponseDto & {
  isStarred: boolean;
};
