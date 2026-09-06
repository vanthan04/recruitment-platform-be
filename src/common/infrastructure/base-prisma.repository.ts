// `Delegate` is intentionally still bounded with `any[]`/`any` here — it's a
// generic constraint describing "any Prisma model delegate shape" (the
// upper bound every concrete delegate like `Prisma.UserDelegate` must
// satisfy), not a type assigned to real data. The actual argument/return
// types below are all derived from whichever concrete `Delegate` a subclass
// passes in (see user-prisma.repository.ts), via `Parameters`/`ReturnType`,
// so callers get real Prisma types rather than `any`.
export abstract class BasePrismaRepository<
  Delegate extends {
    findUnique: (...args: any[]) => Promise<any>;
    findMany: (...args: any[]) => Promise<any>;
    create: (...args: any[]) => Promise<any>;
    update: (...args: any[]) => Promise<any>;
    delete: (...args: any[]) => Promise<any>;
    count: (...args: any[]) => Promise<any>;
  },
  Args extends {
    findUnique: unknown;
    findMany: unknown;
    create: unknown;
    update: unknown;
    delete: unknown;
  },
> {
  constructor(protected readonly delegate: Delegate) {}

  async findUnique(
    options: Args['findUnique'],
  ): Promise<Awaited<ReturnType<Delegate['findUnique']>>> {
    // Inside a generic method, `this.delegate.findUnique(...)` only resolves
    // to the constraint's `Promise<any>` — TS can't narrow it to the real
    // per-subclass return type until `Delegate` is instantiated by a caller.
    // The cast asserts what the constraint comment above already documents.
    return this.delegate.findUnique(options) as Promise<
      Awaited<ReturnType<Delegate['findUnique']>>
    >;
  }

  async findMany(
    options?: Args['findMany'],
  ): Promise<Awaited<ReturnType<Delegate['findMany']>>> {
    return this.delegate.findMany(options) as Promise<
      Awaited<ReturnType<Delegate['findMany']>>
    >;
  }

  async create(
    options: Args['create'],
  ): Promise<Awaited<ReturnType<Delegate['create']>>> {
    return this.delegate.create(options) as Promise<
      Awaited<ReturnType<Delegate['create']>>
    >;
  }

  async update(
    options: Args['update'],
  ): Promise<Awaited<ReturnType<Delegate['update']>>> {
    return this.delegate.update(options) as Promise<
      Awaited<ReturnType<Delegate['update']>>
    >;
  }

  async delete(
    options: Args['delete'],
  ): Promise<Awaited<ReturnType<Delegate['delete']>>> {
    return this.delegate.delete(options) as Promise<
      Awaited<ReturnType<Delegate['delete']>>
    >;
  }

  async count(options?: Parameters<Delegate['count']>[0]): Promise<number> {
    return this.delegate.count(options) as Promise<number>;
  }
}
