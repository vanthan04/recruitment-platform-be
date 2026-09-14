import { User } from '@/modules/user/domain/entities/user.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

/**
 * This entity is intentionally thin — it holds no status-transition or
 * self-lockout invariants of its own (those live in
 * admin-update-user-status.command.ts, already unit-tested there). What's
 * covered here is the one piece of real conditional logic the entity does
 * have: the constructor's googleId/facebookId defaulting.
 */
describe('User entity', () => {
  const basePartial = {
    email: 'user@example.com',
    role: UserRole.CANDIDATE,
    status: UserStatus.ACTIVE,
  };

  it('defaults googleId and facebookId to null when omitted', () => {
    const user = new User(basePartial);

    expect(user.googleId).toBeNull();
    expect(user.facebookId).toBeNull();
  });

  it('preserves an explicitly provided googleId/facebookId', () => {
    const user = new User({
      ...basePartial,
      googleId: 'google-123',
      facebookId: 'facebook-456',
    });

    expect(user.googleId).toBe('google-123');
    expect(user.facebookId).toBe('facebook-456');
  });

  it('preserves an explicit null for googleId/facebookId rather than treating it as omitted', () => {
    const user = new User({ ...basePartial, googleId: null, facebookId: null });

    expect(user.googleId).toBeNull();
    expect(user.facebookId).toBeNull();
  });

  it('changeStatus sets the new status', () => {
    const user = new User({ ...basePartial, status: UserStatus.PENDING });

    user.changeStatus(UserStatus.BLOCKED);

    expect(user.status).toBe(UserStatus.BLOCKED);
  });

  it('changeRole sets the new role', () => {
    const user = new User({ ...basePartial, role: UserRole.CANDIDATE });

    user.changeRole(UserRole.RECRUITER);

    expect(user.role).toBe(UserRole.RECRUITER);
  });
});
