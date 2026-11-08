import {
  applicationStatusChangedText,
  applicationStatusSystemMessageKey,
} from '@/modules/chat/application/utils/system-message-text.util';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

describe('applicationStatusChangedText', () => {
  it('names the new status in Vietnamese, as the status badge does', () => {
    expect(applicationStatusChangedText('INTERVIEW')).toBe(
      'Đơn ứng tuyển đã chuyển sang trạng thái "Phỏng vấn".',
    );
    expect(applicationStatusChangedText('REJECTED')).toBe(
      'Đơn ứng tuyển đã chuyển sang trạng thái "Đã từ chối".',
    );
  });

  // Chat keeps its own copy of the labels (modules don't import each other's
  // domain in production code) — this keeps it from silently missing a status
  // if the pipeline grows.
  it('has a real label for every status in the pipeline (never the raw enum name)', () => {
    for (const status of Object.values(ApplicationStatus)) {
      expect(applicationStatusChangedText(status)).not.toContain(`"${status}"`);
    }
  });

  it('falls back to the raw status for one it does not know, instead of failing', () => {
    expect(applicationStatusChangedText('SOMETHING_NEW')).toBe(
      'Đơn ứng tuyển đã chuyển sang trạng thái "SOMETHING_NEW".',
    );
  });
});

describe('applicationStatusSystemMessageKey', () => {
  it('is stable for the same transition and distinct across applications and statuses', () => {
    const key = applicationStatusSystemMessageKey('app-1', 'INTERVIEW');
    expect(applicationStatusSystemMessageKey('app-1', 'INTERVIEW')).toBe(key);
    expect(applicationStatusSystemMessageKey('app-2', 'INTERVIEW')).not.toBe(
      key,
    );
    expect(applicationStatusSystemMessageKey('app-1', 'OFFER')).not.toBe(key);
  });
});
