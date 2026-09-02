import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PermissionsService } from '@/modules/permission/application/permissions.service';
import { Permission } from '@/common/enums/permission.enum';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let permissionsService: jest.Mocked<
    Pick<PermissionsService, 'getPermissionsForRole'>
  >;

  const makeContext = (user: any): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    permissionsService = { getPermissionsForRole: jest.fn() };
    guard = new PermissionGuard(reflector as any, permissionsService as any);
  });

  it('allows the request when the route declares no @RequirePermissions', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(makeContext({ role: 'CANDIDATE' })),
    ).resolves.toBe(true);
    expect(permissionsService.getPermissionsForRole).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when there is no authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.JOB_CREATE]);

    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("allows the request when the user's role grants every required permission", async () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.JOB_CREATE]);
    permissionsService.getPermissionsForRole.mockResolvedValue(
      new Set([Permission.JOB_CREATE, Permission.JOB_UPDATE]),
    );

    await expect(
      guard.canActivate(makeContext({ role: 'RECRUITER' })),
    ).resolves.toBe(true);
    expect(permissionsService.getPermissionsForRole).toHaveBeenCalledWith(
      'RECRUITER',
    );
  });

  it('throws ForbiddenException when the role is missing a required permission', async () => {
    reflector.getAllAndOverride.mockReturnValue([Permission.JOB_DELETE]);
    permissionsService.getPermissionsForRole.mockResolvedValue(
      new Set([Permission.JOB_CREATE]),
    );

    await expect(
      guard.canActivate(makeContext({ role: 'RECRUITER' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('requires every listed permission, not just one of them', async () => {
    reflector.getAllAndOverride.mockReturnValue([
      Permission.APPLICATION_READ,
      Permission.APPLICATION_UPDATE,
    ]);
    permissionsService.getPermissionsForRole.mockResolvedValue(
      new Set([Permission.APPLICATION_READ]),
    );

    await expect(
      guard.canActivate(makeContext({ role: 'RECRUITER' })),
    ).rejects.toThrow(ForbiddenException);
  });
});
