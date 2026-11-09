// Local-only demo data — NOT wired into `npm run db:seed` (that script runs
// automatically on every production container start, see DEPLOY.md §1).
// Run manually against your local/dev database:
//
//   npm run db:seed          (first — creates roles/categories/skills this depends on)
//   DEMO_SEED_PASSWORD=<choose one> npm run db:seed:demo
//   (PowerShell: $env:DEMO_SEED_PASSWORD = "<choose one>"; npm run db:seed:demo)
//
// The demo accounts' password comes from DEMO_SEED_PASSWORD so it is never
// committed or printed. It only applies to accounts this script creates; an
// existing account keeps its password.
//
// Users/companies/jobs/CVs are upserted by a stable key, so re-running never
// duplicates them. Applications/bookmarks are seeded by randomly sampling
// candidate<->job pairs each run; re-running is still safe (the underlying
// unique constraint prevents a literal duplicate) but may add a few more
// legitimate pairs until every candidate has applied/bookmarked most jobs.
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  Gender,
  CvFileType,
  CvAnalysisStatus,
  JobStatus,
  EmploymentType,
  WorkMode,
  JobLevel,
  CompanySize,
  CompanyType,
  ApplicationStatus,
  ChatParticipantRole,
  InterviewStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data with NODE_ENV=production.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function requireDemoPassword(): string {
  const password = process.env.DEMO_SEED_PASSWORD ?? '';
  if (password.length < 8) {
    console.error(
      'Set DEMO_SEED_PASSWORD (at least 8 characters) to the password the demo accounts should get.',
    );
    process.exit(1);
  }
  return password;
}

const DEMO_PASSWORD = requireDemoPassword();

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: readonly T[], min: number, max: number): T[] {
  const count = Math.min(
    arr.length,
    min + Math.floor(Math.random() * (max - min + 1)),
  );
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─────────────────────────────────────────────
// Fixture data
// ─────────────────────────────────────────────

const COMPANIES = [
  {
    slug: 'tech-vision',
    name: 'TechVision Solutions',
    description:
      'Công ty phát triển phần mềm sản phẩm cho thị trường Đông Nam Á.',
    website: 'https://techvision.example.com',
    size: CompanySize.SIZE_51_200,
    companyType: CompanyType.PRODUCT,
    province: 'Hồ Chí Minh',
    address: '123 Nguyễn Huệ, Quận 1',
  },
  {
    slug: 'globalsoft-outsourcing',
    name: 'GlobalSoft Outsourcing',
    description: 'Gia công phần mềm cho khách hàng Nhật Bản và châu Âu.',
    website: 'https://globalsoft.example.com',
    size: CompanySize.SIZE_201_500,
    companyType: CompanyType.OUTSOURCING,
    province: 'Hà Nội',
    address: '45 Trần Duy Hưng, Cầu Giấy',
  },
  {
    slug: 'fintrack-startup',
    name: 'FinTrack',
    description: 'Startup fintech xây dựng nền tảng quản lý tài chính cá nhân.',
    website: 'https://fintrack.example.com',
    size: CompanySize.SIZE_11_50,
    companyType: CompanyType.STARTUP,
    province: 'Đà Nẵng',
    address: '9 Bạch Đằng',
  },
  {
    slug: 'cloudnest-consulting',
    name: 'CloudNest Consulting',
    description:
      'Tư vấn và triển khai giải pháp cloud/DevOps cho doanh nghiệp.',
    website: 'https://cloudnest.example.com',
    size: CompanySize.SIZE_11_50,
    companyType: CompanyType.CONSULTING,
    province: 'Hồ Chí Minh',
    address: '78 Điện Biên Phủ, Bình Thạnh',
  },
] as const;

const RECRUITERS = [
  {
    email: 'recruiter1@demo.local',
    fullName: 'Nguyễn Thu Hà',
    companySlug: 'tech-vision',
  },
  {
    email: 'recruiter2@demo.local',
    fullName: 'Trần Minh Khoa',
    companySlug: 'globalsoft-outsourcing',
  },
  {
    email: 'recruiter3@demo.local',
    fullName: 'Lê Phương Anh',
    companySlug: 'fintrack-startup',
  },
  {
    email: 'recruiter4@demo.local',
    fullName: 'Phạm Đức Huy',
    companySlug: 'cloudnest-consulting',
  },
] as const;

const CANDIDATE_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bích',
  'Lê Hoàng Cường',
  'Phạm Thị Dung',
  'Hoàng Văn Em',
  'Vũ Thị Giang',
  'Đặng Minh Hải',
  'Bùi Thị Yến',
  'Đỗ Văn Khang',
  'Ngô Thị Lan',
  'Dương Văn Minh',
  'Lý Thị Ngọc',
] as const;

const HEADLINES = [
  'Frontend Developer',
  'Backend Developer',
  'Full-stack Developer',
  'Mobile Developer (React Native)',
  'DevOps Engineer',
  'QA/Automation Tester',
  'Data Engineer',
  'UI/UX Designer',
  'Business Analyst',
  'IT Support Specialist',
] as const;

const JOB_TITLES = [
  'Backend Developer (Node.js/NestJS)',
  'Frontend Developer (React/Next.js)',
  'Full-stack Developer',
  'Mobile Developer (React Native)',
  'DevOps Engineer',
  'QA Automation Engineer',
  'Data Engineer',
  'UI/UX Designer',
  'Business Analyst',
  'IT Support Engineer',
  'Java Backend Developer',
  '.NET Developer',
] as const;

const JOB_DESCRIPTION = `Chúng tôi đang tìm kiếm ứng viên có đam mê công nghệ, mong muốn phát triển sự nghiệp trong môi trường chuyên nghiệp, năng động.

Trách nhiệm chính:
- Phối hợp với team phát triển sản phẩm theo quy trình Agile/Scrum.
- Tham gia thiết kế, xây dựng và bảo trì hệ thống.
- Đảm bảo chất lượng code thông qua code review và unit test.`;

const REQUIREMENTS = [
  'Tối thiểu 1 năm kinh nghiệm ở vị trí tương đương',
  'Có khả năng làm việc nhóm và giao tiếp tốt',
  'Chủ động học hỏi công nghệ mới',
  'Ưu tiên có kinh nghiệm làm việc với hệ thống production',
];

const BENEFITS = [
  'Lương tháng 13, review lương 2 lần/năm',
  'Bảo hiểm sức khỏe cao cấp',
  'Chế độ nghỉ phép 15 ngày/năm',
  'Laptop và trang thiết bị làm việc đầy đủ',
];

const WORKING_HOURS = ['Thứ 2 - Thứ 6, 8:30 - 17:30'];

const EDUCATION_OPTIONS = [
  'Đại học Bách Khoa Hà Nội - Kỹ sư CNTT',
  'Đại học Công nghệ Thông tin TP.HCM - Kỹ sư phần mềm',
  'Đại học FPT - Kỹ sư CNTT',
  'Đại học Khoa học Tự nhiên - Cử nhân CNTT',
];

// ─────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────

async function main() {
  const [adminRole, recruiterRole, candidateRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } }),
    prisma.role.findUniqueOrThrow({ where: { name: 'RECRUITER' } }),
    prisma.role.findUniqueOrThrow({ where: { name: 'CANDIDATE' } }),
  ]);

  const categories = await prisma.category.findMany();
  const skills = await prisma.skill.findMany();
  if (categories.length === 0 || skills.length === 0) {
    throw new Error(
      'No categories/skills found — run `npm run db:seed` before this script.',
    );
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, await bcrypt.genSalt());

  console.log('Seeding admin user...');
  await upsertUser('admin@demo.local', adminRole.id, passwordHash, {
    fullName: 'Quản Trị Viên',
    headline: 'Platform Administrator',
  });

  console.log('Seeding companies + recruiters...');
  const companyByRecruiterEmail = new Map<string, string>();
  for (const recruiter of RECRUITERS) {
    const owner = await upsertUser(
      recruiter.email,
      recruiterRole.id,
      passwordHash,
      { fullName: recruiter.fullName, headline: 'HR Recruiter' },
    );

    const companyFixture = COMPANIES.find(
      (c) => c.slug === recruiter.companySlug,
    )!;
    const company = await prisma.company.upsert({
      where: { slug: companyFixture.slug },
      update: { ...companyFixture, ownerId: owner.id },
      create: { ...companyFixture, ownerId: owner.id },
    });
    companyByRecruiterEmail.set(recruiter.email, company.id);
  }

  console.log('Seeding candidates + CVs + CV analyses...');
  const candidateIds: string[] = [];
  for (let i = 0; i < CANDIDATE_NAMES.length; i++) {
    const fullName = CANDIDATE_NAMES[i];
    const email = `candidate${i + 1}@demo.local`;
    const headline = pick(HEADLINES);
    const candidate = await upsertUser(email, candidateRole.id, passwordHash, {
      fullName,
      headline,
      gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE,
      birthDate: new Date(
        randomInt(1990, 2002),
        randomInt(0, 11),
        randomInt(1, 28),
      ),
    });
    candidateIds.push(candidate.id);

    const cvSkills = pickMany(
      skills.map((s) => s.name.toLowerCase()),
      3,
      7,
    );
    const cv = await prisma.cv.upsert({
      where: { id: deterministicId('cv', email) },
      update: {},
      create: {
        id: deterministicId('cv', email),
        title: `CV - ${fullName}`,
        originalName: `cv-${email.split('@')[0]}.pdf`,
        fileType: CvFileType.PDF,
        mimeType: 'application/pdf',
        fileSize: randomInt(80_000, 500_000),
        fileKey: `demo/cv-placeholder.pdf`,
        userId: candidate.id,
      },
    });

    await prisma.cvAnalysis.upsert({
      where: { cvId: cv.id },
      update: {},
      create: {
        cvId: cv.id,
        status: CvAnalysisStatus.COMPLETED,
        summary: `${headline} với ${randomInt(1, 8)} năm kinh nghiệm, thành thạo ${cvSkills.slice(0, 3).join(', ')}.`,
        skills: cvSkills,
        experienceYears: randomInt(1, 8),
        education: [pick(EDUCATION_OPTIONS)],
        analyzedAt: new Date(),
        model: 'demo-seed',
      },
    });
  }

  console.log('Seeding jobs...');
  const jobIds: { id: string; companyId: string }[] = [];
  for (const recruiter of RECRUITERS) {
    const recruiterUser = await prisma.user.findUniqueOrThrow({
      where: { email: recruiter.email },
    });
    const companyId = companyByRecruiterEmail.get(recruiter.email)!;

    // Fixed (not random) so the deterministic job ids below stay stable
    // across re-runs — a random count here would keep growing the job set
    // on every re-run instead of upserting the same rows.
    const jobCount = 4;
    for (let i = 0; i < jobCount; i++) {
      const title = pick(JOB_TITLES);
      const category = pick(categories);
      const jobSkills = pickMany(skills, 3, 6);
      const status = pick([
        JobStatus.OPEN,
        JobStatus.OPEN,
        JobStatus.OPEN,
        JobStatus.DRAFT,
        JobStatus.CLOSED,
      ]);
      const salaryMin = randomInt(10, 25) * 1_000_000;

      const jobId = deterministicId('job', `${recruiter.email}-${i}`);
      await prisma.job.upsert({
        where: { id: jobId },
        update: {},
        create: {
          id: jobId,
          title,
          description: JOB_DESCRIPTION,
          location: pick(['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Remote']),
          employmentType: pick([
            EmploymentType.FULL_TIME,
            EmploymentType.FULL_TIME,
            EmploymentType.PART_TIME,
            EmploymentType.INTERNSHIP,
          ]),
          workMode: pick([WorkMode.ONSITE, WorkMode.HYBRID, WorkMode.REMOTE]),
          level: pick([
            JobLevel.FRESHER,
            JobLevel.JUNIOR,
            JobLevel.MIDDLE,
            JobLevel.SENIOR,
          ]),
          status,
          salaryMin,
          salaryMax: salaryMin + randomInt(5, 15) * 1_000_000,
          requirements: REQUIREMENTS,
          benefits: BENEFITS,
          workingHours: WORKING_HOURS,
          expiresAt: new Date(Date.now() + randomInt(10, 60) * 86_400_000),
          postedById: recruiterUser.id,
          companyId,
          categoryId: category.id,
          skills: {
            create: jobSkills.map((skill) => ({ skillId: skill.id })),
          },
        },
      });
      jobIds.push({ id: jobId, companyId });
    }
  }

  console.log('Seeding job applications + bookmarks...');
  const openJobs = await prisma.job.findMany({
    where: { id: { in: jobIds.map((j) => j.id) }, status: JobStatus.OPEN },
    include: { company: true },
  });
  const statusFlow: ApplicationStatus[] = [
    ApplicationStatus.APPLIED,
    ApplicationStatus.SCREENING,
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFER,
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
  ];

  for (const candidateId of candidateIds) {
    const candidateCv = await prisma.cv.findFirst({
      where: { userId: candidateId },
    });
    const jobsToApply = pickMany(openJobs, 1, 4);
    for (const job of jobsToApply) {
      // A plain upsert would re-roll `status` on every run and, since
      // `update: {}` leaves the persisted row untouched, drift out of sync
      // with the interview/conversation created below (which would then key
      // off a status the application was never actually saved with) while
      // also spamming a new ApplicationStatusHistory row each time. Skipping
      // already-seeded pairs entirely keeps this idempotent.
      const existing = await prisma.jobApplication.findUnique({
        where: { userId_jobId: { userId: candidateId, jobId: job.id } },
      });
      if (existing) continue;

      const applicationId = deterministicId('app', `${candidateId}-${job.id}`);
      const status = pick(statusFlow);
      const application = await prisma.jobApplication.create({
        data: {
          id: applicationId,
          userId: candidateId,
          jobId: job.id,
          cvId: candidateCv?.id,
          status,
          coverLetter:
            'Tôi rất mong muốn được ứng tuyển vào vị trí này và đóng góp cho công ty.',
        },
      });

      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: status,
          note: 'Demo seed data',
        },
      });

      if (
        status === ApplicationStatus.INTERVIEW ||
        status === ApplicationStatus.OFFER ||
        status === ApplicationStatus.HIRED
      ) {
        await prisma.interviewSchedule.upsert({
          where: { id: deterministicId('interview', application.id) },
          update: {},
          create: {
            id: deterministicId('interview', application.id),
            jobApplicationId: application.id,
            scheduledAt: new Date(Date.now() + randomInt(1, 14) * 86_400_000),
            durationMinutes: 45,
            location: 'Online - Google Meet',
            meetingLink: 'https://meet.google.com/demo-link',
            status: InterviewStatus.SCHEDULED,
            createdById: job.postedById,
          },
        });

        const conversation = await prisma.conversation.upsert({
          where: { applicationId: application.id },
          update: {},
          create: {
            jobId: job.id,
            applicationId: application.id,
            candidateId,
            recruiterId: job.postedById,
            lastMessageAt: new Date(),
            members: {
              create: [
                { userId: candidateId, role: ChatParticipantRole.CANDIDATE },
                { userId: job.postedById, role: ChatParticipantRole.RECRUITER },
              ],
            },
          },
        });

        await prisma.message.upsert({
          where: {
            conversationId_clientMessageId: {
              conversationId: conversation.id,
              clientMessageId: 'demo-seed-1',
            },
          },
          update: {},
          create: {
            conversationId: conversation.id,
            senderId: job.postedById,
            content:
              'Chào bạn, chúng tôi đã xem hồ sơ và muốn trao đổi thêm về vị trí này.',
            clientMessageId: 'demo-seed-1',
          },
        });
      }
    }

    const jobsToBookmark = pickMany(openJobs, 0, 3);
    for (const job of jobsToBookmark) {
      await prisma.bookmark.upsert({
        where: { userId_jobId: { userId: candidateId, jobId: job.id } },
        update: {},
        create: { userId: candidateId, jobId: job.id },
      });
    }
  }

  console.log('Demo data seed complete.');
  console.log(
    'Demo accounts created by this run use the password from DEMO_SEED_PASSWORD.',
  );
  console.log('  admin@demo.local (ADMIN)');
  console.log('  recruiter1..4@demo.local (RECRUITER)');
  console.log(`  candidate1..${CANDIDATE_NAMES.length}@demo.local (CANDIDATE)`);
}

async function upsertUser(
  email: string,
  roleId: string,
  passwordHash: string,
  profile: {
    fullName: string;
    headline?: string;
    gender?: Gender;
    birthDate?: Date;
  },
) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: passwordHash,
      roleId,
      status: 'ACTIVE',
      profile: {
        create: {
          fullName: profile.fullName,
          headline: profile.headline,
          gender: profile.gender,
          birthDate: profile.birthDate,
          summary: `Xin chào, tôi là ${profile.fullName}.`,
        },
      },
    },
  });
}

// Deterministic UUID-ish id derived from a stable seed string, so re-running
// this script upserts the same rows instead of creating duplicates (Job/Cv/
// etc. don't have a natural unique business key to upsert on).
function deterministicId(prefix: string, seed: string): string {
  let hash = 0;
  const input = `${prefix}:${seed}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  const hex = hash.toString(16).padStart(8, '0');
  return `00000000-0000-4000-8000-${hex}${hex.slice(0, 4)}`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
