-- Phase 6 of the recruitment-platform refactor.
--
-- 1) OauthLoginCode used to pre-generate and store the real access/refresh
--    JWTs in plaintext, keyed by a one-time code. Google/Facebook login was
--    never actually implemented against this table (see
--    GOOGLE_FACEBOOK_LOGIN_PLAN.md — still a draft), so it holds no real
--    rows; any stray/expired ones are cleared before reshaping the table so
--    the new NOT NULL "userId" column can be added directly. Going forward
--    the code only identifies *who* logged in; tokens are minted fresh at
--    exchange time.
DELETE FROM "oauth_login_codes";

ALTER TABLE "oauth_login_codes"
  DROP COLUMN "accessToken",
  DROP COLUMN "refreshToken";

ALTER TABLE "oauth_login_codes"
  ADD COLUMN "userId" TEXT NOT NULL,
  ADD COLUMN "usedAt" TIMESTAMP(3);

CREATE INDEX "oauth_login_codes_userId_idx" ON "oauth_login_codes"("userId");

ALTER TABLE "oauth_login_codes" ADD CONSTRAINT "oauth_login_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2) User.verifyCode was a single plaintext column shared by BOTH email
-- verification and password reset (`findByVerifyCode` didn't distinguish
-- purpose) — a code emailed for one could be looked up and consumed for the
-- other. Replaced by VerificationToken, which stores only a hash and scopes
-- each token to its purpose via `type`.
--
-- Personal-project dev database: any user currently mid-verification or
-- mid-password-reset (a non-null verifyCode) will need to re-request a new
-- code after this migration — their old plaintext code has no equivalent
-- hashed row to migrate into (deliberately: we never want to carry a
-- plaintext secret forward into the new hashed-token table).
CREATE TYPE "VerificationTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "type" "VerificationTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");
CREATE INDEX "verification_tokens_userId_idx" ON "verification_tokens"("userId");

ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" DROP COLUMN "verifyCode";
