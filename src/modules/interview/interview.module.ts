import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InterviewController } from '@/modules/interview/presentation/controllers/interview.controller';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { InterviewScheduleInfraRepository } from '@/modules/interview/infrastructure/repositories/interview-schedule.infra-repository';
import { InterviewSchedulePrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-schedule-prisma.repository';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewSessionInfraRepository } from '@/modules/interview/infrastructure/repositories/interview-session.infra-repository';
import { InterviewSessionPrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-session-prisma.repository';
import { IInterviewReadRepository } from '@/modules/interview/domain/repositories/interview-read.repository';
import { InterviewReadInfraRepository } from '@/modules/interview/infrastructure/repositories/interview-read.infra-repository';
import { InterviewReadPrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-read-prisma.repository';
import { StartInterviewSessionHandler } from '@/modules/interview/application/commands/start-interview-session.command';
import { EndInterviewSessionHandler } from '@/modules/interview/application/commands/end-interview-session.command';
import { GetInterviewHandler } from '@/modules/interview/application/queries/get-interview.query';
import { ListMyInterviewsHandler } from '@/modules/interview/application/queries/list-my-interviews.query';
import { ListInterviewSessionsHandler } from '@/modules/interview/application/queries/list-interview-sessions.query';
import { JobModule } from '@/modules/job/job.module';
import { JobApplicationModule } from '@/modules/application/job-application.module';
import { UserModule } from '@/modules/user/user.module';
import { MailModule } from '@/modules/mail/mail.module';

import { IInterviewJobLookupPort } from '@/modules/interview/application/ports/job-lookup.port';
import { InterviewJobLookupAdapter } from '@/modules/interview/infrastructure/adapters/job-lookup.adapter';
import { IInterviewApplicationLookupPort } from '@/modules/interview/application/ports/application-lookup.port';
import { InterviewApplicationLookupAdapter } from '@/modules/interview/infrastructure/adapters/application-lookup.adapter';
import { IInterviewUserLookupPort } from '@/modules/interview/application/ports/user-lookup.port';
import { InterviewUserLookupAdapter } from '@/modules/interview/infrastructure/adapters/user-lookup.adapter';
import { IInterviewMailPort } from '@/modules/interview/application/ports/mail.port';
import { InterviewMailAdapter } from '@/modules/interview/infrastructure/adapters/mail.adapter';

import { ScheduleInterviewHandler } from '@/modules/interview/application/commands/schedule-interview.command';
import { RescheduleInterviewHandler } from '@/modules/interview/application/commands/reschedule-interview.command';
import { CancelInterviewHandler } from '@/modules/interview/application/commands/cancel-interview.command';
import { CompleteInterviewHandler } from '@/modules/interview/application/commands/complete-interview.command';
import { MarkInterviewNoShowHandler } from '@/modules/interview/application/commands/mark-interview-no-show.command';
import { ListInterviewsByApplicationHandler } from '@/modules/interview/application/queries/list-interviews-by-application.query';
import { SendInterviewRemindersHandler } from '@/modules/interview/application/commands/send-interview-reminders.command';
import { SendInterviewRemindersCron } from '@/modules/interview/application/jobs/send-interview-reminders.cron';

@Module({
  imports: [
    CqrsModule,
    JobModule,
    JobApplicationModule,
    UserModule,
    MailModule,
  ],
  controllers: [InterviewController],
  providers: [
    InterviewSchedulePrismaRepository,
    {
      provide: IInterviewScheduleRepository,
      useClass: InterviewScheduleInfraRepository,
    },
    {
      provide: IInterviewJobLookupPort,
      useClass: InterviewJobLookupAdapter,
    },
    {
      provide: IInterviewApplicationLookupPort,
      useClass: InterviewApplicationLookupAdapter,
    },
    {
      provide: IInterviewUserLookupPort,
      useClass: InterviewUserLookupAdapter,
    },
    {
      provide: IInterviewMailPort,
      useClass: InterviewMailAdapter,
    },
    InterviewSessionPrismaRepository,
    {
      provide: IInterviewSessionRepository,
      useClass: InterviewSessionInfraRepository,
    },
    InterviewReadPrismaRepository,
    {
      provide: IInterviewReadRepository,
      useClass: InterviewReadInfraRepository,
    },
    StartInterviewSessionHandler,
    EndInterviewSessionHandler,
    GetInterviewHandler,
    ListMyInterviewsHandler,
    ListInterviewSessionsHandler,
    ScheduleInterviewHandler,
    RescheduleInterviewHandler,
    CancelInterviewHandler,
    CompleteInterviewHandler,
    MarkInterviewNoShowHandler,
    ListInterviewsByApplicationHandler,
    SendInterviewRemindersHandler,
    SendInterviewRemindersCron,
  ],
})
export class InterviewModule {}
