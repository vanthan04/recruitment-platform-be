import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import {
  JobApplicationNotFoundException,
  ReferencedJobNotFoundException,
} from '@/modules/application/domain/exceptions/application.exceptions';
import { ensureOwner } from '@/common/utils/ownership.util';

/**
 * Loads an application for an action only the job's poster may take (reading
 * or writing its notes and star), refusing everyone else — including the
 * candidate who submitted it: this data is recruiter-private.
 */
export async function loadApplicationOwnedBy(
  applicationRepository: IJobApplicationRepository,
  jobLookupPort: IJobLookupPort,
  applicationId: string,
  recruiterId: string,
): Promise<JobApplication> {
  const application = await applicationRepository.findById(applicationId);
  if (!application) throw new JobApplicationNotFoundException(applicationId);

  const job = await jobLookupPort.findById(application.jobId);
  if (!job) throw new ReferencedJobNotFoundException(application.jobId);

  ensureOwner(
    job.postedById,
    recruiterId,
    "Only the job poster can see or change this application's notes and star",
    'APPLICATION_ANNOTATION_ACCESS_DENIED',
  );
  return application;
}
