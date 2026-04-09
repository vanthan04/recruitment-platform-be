import { PrismaClient } from '@prisma/client';

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
    findUnique: any;
    findMany: any;
    create: any;
    update: any;
    delete: any;
  },
> {
  constructor(protected readonly delegate: Delegate) {}

  async findUnique(options: Args['findUnique']): Promise<any> {
    return this.delegate.findUnique(options);
  }

  async findMany(options?: Args['findMany']): Promise<any[]> {
    return this.delegate.findMany(options);
  }

  async create(options: Args['create']): Promise<any> {
    return this.delegate.create(options);
  }

  async update(options: Args['update']): Promise<any> {
    return this.delegate.update(options);
  }

  async delete(options: Args['delete']): Promise<any> {
    return this.delegate.delete(options);
  }

  async count(options?: any): Promise<number> {
    return this.delegate.count(options);
  }
}
