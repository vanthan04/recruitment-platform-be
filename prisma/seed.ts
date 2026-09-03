import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: 'ADMIN', description: 'Platform administrator' },
  { name: 'RECRUITER', description: 'Recruiter / company representative' },
  { name: 'CANDIDATE', description: 'Job-seeking candidate' },
] as const;

// Only permissions the application actually has controller endpoints for.
const PERMISSIONS = [
  // job
  { name: 'job:create', description: 'Create a job posting' },
  { name: 'job:update', description: 'Update a job posting (incl. close/reopen)' },
  { name: 'job:delete', description: 'Delete a job posting' },
  { name: 'job:read:own', description: 'List own job postings, any status' },
  // company
  { name: 'company:create', description: 'Create a company' },
  { name: 'company:update', description: 'Update a company' },
  { name: 'company:delete', description: 'Delete a company' },
  // category
  { name: 'category:create', description: 'Create a job category' },
  { name: 'category:update', description: 'Update a job category' },
  { name: 'category:delete', description: 'Delete a job category' },
  // saved search / job alert
  { name: 'saved-search:create', description: 'Create a saved job search / alert' },
  { name: 'saved-search:read', description: 'List own saved job searches' },
  { name: 'saved-search:delete', description: 'Delete own saved job search' },
  // bookmark
  { name: 'bookmark:manage', description: 'Toggle a job bookmark' },
  { name: 'bookmark:read', description: 'List own bookmarked jobs' },
  // user administration
  { name: 'user:read', description: 'List platform users (admin)' },
  { name: 'user:update', description: "Update a user's status/role (admin)" },
  // job application
  { name: 'application:create', description: 'Apply for a job' },
  { name: 'application:read', description: 'Read applications for jobs the recruiter owns' },
  { name: 'application:read:own', description: 'Read own job applications' },
  { name: 'application:update', description: 'Update an application status (recruiter)' },
  { name: 'application:withdraw:own', description: 'Withdraw own job application' },
  // cv
  { name: 'cv:create', description: 'Create a CV' },
  { name: 'cv:read:own', description: 'List own CVs' },
  { name: 'cv:update:own', description: 'Update/publish/upload own CV' },
  { name: 'cv:delete:own', description: 'Delete own CV' },
  // chat
  { name: 'conversation:create', description: 'Start a conversation for an accepted application' },
  // interview
  { name: 'interview:create', description: 'Schedule an interview' },
  { name: 'interview:update', description: 'Reschedule/cancel an interview' },
  { name: 'interview:read', description: 'View interviews for a job application' },
  // profile (self-service, available to every role)
  { name: 'profile:read:own', description: 'Read own profile' },
  { name: 'profile:update:own', description: 'Update own profile' },
  // RBAC administration
  { name: 'role:permission:manage', description: 'View/manage role -> permission assignments (admin)' },
] as const;

const ROLE_PERMISSIONS: Record<(typeof ROLES)[number]['name'], string[]> = {
  ADMIN: [
    'category:create',
    'category:update',
    'category:delete',
    'user:read',
    'user:update',
    'role:permission:manage',
    'profile:read:own',
    'profile:update:own',
  ],
  RECRUITER: [
    'job:create',
    'job:update',
    'job:delete',
    'job:read:own',
    'company:create',
    'company:update',
    'company:delete',
    'application:read',
    'application:update',
    'conversation:create',
    'interview:create',
    'interview:update',
    'interview:read',
    'profile:read:own',
    'profile:update:own',
  ],
  CANDIDATE: [
    'saved-search:create',
    'saved-search:read',
    'saved-search:delete',
    'bookmark:manage',
    'bookmark:read',
    'application:create',
    'application:read:own',
    'application:withdraw:own',
    'cv:create',
    'cv:read:own',
    'cv:update:own',
    'cv:delete:own',
    'interview:read',
    'profile:read:own',
    'profile:update:own',
  ],
};

async function main() {
  console.log('Seeding RBAC roles...');
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  console.log('Seeding RBAC permissions...');
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: permission,
    });
  }

  console.log('Wiring role -> permission assignments...');
  for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { name: permissionName },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  console.log('RBAC seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
