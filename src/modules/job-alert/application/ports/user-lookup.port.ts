export interface UserEmailLookupResult {
  email: string;
}

export abstract class IUserLookupPort {
  abstract findById(userId: string): Promise<UserEmailLookupResult | null>;
}
