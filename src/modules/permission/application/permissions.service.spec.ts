import { PermissionsService } from './permissions.service';

describe('PermissionsService', () => {
  let prisma: any;
  let service: PermissionsService;

  beforeEach(() => {
    prisma = {
      role: { findUnique: jest.fn() },
    };
    service = new PermissionsService(prisma);
  });

  it('returns the permission names granted to a role via a single joined query', async () => {
    prisma.role.findUnique.mockResolvedValue({
      rolePermissions: [
        { permission: { name: 'job:create' } },
        { permission: { name: 'job:update' } },
      ],
    });

    const permissions = await service.getPermissionsForRole('RECRUITER');

    expect(permissions).toEqual(new Set(['job:create', 'job:update']));
    expect(prisma.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'RECRUITER' },
      include: { rolePermissions: { include: { permission: true } } },
    });
  });

  it('returns an empty set for a role that does not exist', async () => {
    prisma.role.findUnique.mockResolvedValue(null);

    const permissions = await service.getPermissionsForRole('UNKNOWN');

    expect(permissions).toEqual(new Set());
  });

  it('caches the result and does not re-query within the TTL', async () => {
    prisma.role.findUnique.mockResolvedValue({ rolePermissions: [] });

    await service.getPermissionsForRole('ADMIN');
    await service.getPermissionsForRole('ADMIN');

    expect(prisma.role.findUnique).toHaveBeenCalledTimes(1);
  });

  it('re-queries the database after invalidateCache() so a permission change takes effect immediately', async () => {
    prisma.role.findUnique.mockResolvedValue({ rolePermissions: [] });

    await service.getPermissionsForRole('ADMIN');
    service.invalidateCache();
    await service.getPermissionsForRole('ADMIN');

    expect(prisma.role.findUnique).toHaveBeenCalledTimes(2);
  });
});
