export interface ChatUserLookupResult {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export abstract class IChatUserLookupPort {
  abstract findById(userId: string): Promise<ChatUserLookupResult | null>;
}
