export abstract class IUserCompanyLinkPort {
  abstract updateCompanyId(userId: string, companyId: string): Promise<void>;
}
