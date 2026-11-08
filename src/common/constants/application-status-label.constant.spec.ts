import {
  APPLICATION_STATUS_LABEL_VI,
  applicationStatusLabelVi,
} from '@/common/constants/application-status-label.constant';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

describe('application status labels (vi)', () => {
  // Shared code deliberately doesn't import the application module in
  // production code — this test, which may, is what stops a new pipeline
  // status from silently shipping without a label.
  it('has a label for every status in the pipeline, and nothing else', () => {
    expect(Object.keys(APPLICATION_STATUS_LABEL_VI).sort()).toEqual(
      Object.values(ApplicationStatus).sort(),
    );
  });

  it('never uses the raw enum name as the label', () => {
    for (const status of Object.values(ApplicationStatus)) {
      expect(applicationStatusLabelVi(status)).not.toBe(status);
    }
  });

  it('returns the label for a known status', () => {
    expect(applicationStatusLabelVi('INTERVIEW')).toBe('Phỏng vấn');
    expect(applicationStatusLabelVi('HIRED')).toBe('Đã tuyển');
  });

  it('falls back to the raw status for an unknown one instead of throwing', () => {
    expect(applicationStatusLabelVi('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });
});
