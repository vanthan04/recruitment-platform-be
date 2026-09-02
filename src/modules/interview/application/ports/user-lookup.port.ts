export interface InterviewUserLookupResult {
  id: string;
  email: string;
  fullName: string;
}

export abstract class IInterviewUserLookupPort {
  abstract findById(userId: string): Promise<InterviewUserLookupResult | null>;
}
