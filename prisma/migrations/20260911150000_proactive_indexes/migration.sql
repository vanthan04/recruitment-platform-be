-- User.companyId: the one FK on this model without any index. No current
-- query needs it, but it's a natural fit for a future "list recruiters of
-- a company" feature given Company.recruiters already exists.
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- expiresAt on the three token tables: RefreshToken/VerificationToken are
-- purged daily by CleanupExpiredTokensHandler's `expiresAt < now()` delete;
-- OauthLoginCode has no such cleanup yet but gets the same index proactively
-- so one can be added later without another migration.
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");
CREATE INDEX "oauth_login_codes_expiresAt_idx" ON "oauth_login_codes"("expiresAt");
CREATE INDEX "verification_tokens_expiresAt_idx" ON "verification_tokens"("expiresAt");
