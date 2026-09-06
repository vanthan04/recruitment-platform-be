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
    return this.delegate.findUnique(options);
  }

  async findMany(
    options?: Args['findMany'],
  ): Promise<Awaited<ReturnType<Delegate['findMany']>>> {
    return this.delegate.findMany(options);
  }

  async create(
    options: Args['create'],
  ): Promise<Awaited<ReturnType<Delegate['create']>>> {
    return this.delegate.create(options);
  }

  async update(
    options: Args['update'],
  ): Promise<Awaited<ReturnType<Delegate['update']>>> {
    return this.delegate.update(options);
  }

  async delete(
    options: Args['delete'],
  ): Promise<Awaited<ReturnType<Delegate['delete']>>> {
    return this.delegate.delete(options);
  }

  async count(options?: Parameters<Delegate['count']>[0]): Promise<number> {
    return this.delegate.count(options);
  }
}
