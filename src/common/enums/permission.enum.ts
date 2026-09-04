// Stable permission identifiers referenced by application code (controllers,
// seed script). Whether a role actually GRANTS a given permission is decided
// exclusively by the `role_permissions` table in the database — this enum is
// only the vocabulary, never the source of truth for who has what.
export enum Permission {
  JOB_CREATE = 'job:create',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',
  JOB_READ_OWN = 'job:read:own',

  COMPANY_CREATE = 'company:create',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',

  CATEGORY_CREATE = 'category:create',
  CATEGORY_UPDATE = 'category:update',
  CATEGORY_DELETE = 'category:delete',

  SKILL_CREATE = 'skill:create',
  SKILL_UPDATE = 'skill:update',
  SKILL_DELETE = 'skill:delete',

  SAVED_SEARCH_CREATE = 'saved-search:create',
  SAVED_SEARCH_READ = 'saved-search:read',
  SAVED_SEARCH_DELETE = 'saved-search:delete',

  BOOKMARK_MANAGE = 'bookmark:manage',
  BOOKMARK_READ = 'bookmark:read',

  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',

  APPLICATION_CREATE = 'application:create',
  APPLICATION_READ = 'application:read',
  APPLICATION_READ_OWN = 'application:read:own',
  APPLICATION_UPDATE = 'application:update',
  APPLICATION_WITHDRAW_OWN = 'application:withdraw:own',

  CV_CREATE = 'cv:create',
  CV_READ_OWN = 'cv:read:own',
  CV_UPDATE_OWN = 'cv:update:own',
  CV_DELETE_OWN = 'cv:delete:own',

  CONVERSATION_CREATE = 'conversation:create',

  INTERVIEW_CREATE = 'interview:create',
  INTERVIEW_UPDATE = 'interview:update',
  INTERVIEW_READ = 'interview:read',

  PROFILE_READ_OWN = 'profile:read:own',
  PROFILE_UPDATE_OWN = 'profile:update:own',

  ROLE_PERMISSION_MANAGE = 'role:permission:manage',
}
