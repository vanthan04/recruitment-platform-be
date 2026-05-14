export declare abstract class BasePrismaRepository<Delegate extends {
    findUnique: (...args: any[]) => Promise<any>;
    findMany: (...args: any[]) => Promise<any>;
    create: (...args: any[]) => Promise<any>;
    update: (...args: any[]) => Promise<any>;
    delete: (...args: any[]) => Promise<any>;
    count: (...args: any[]) => Promise<any>;
}, Args extends {
    findUnique: any;
    findMany: any;
    create: any;
    update: any;
    delete: any;
}> {
    protected readonly delegate: Delegate;
    constructor(delegate: Delegate);
    findUnique(options: Args['findUnique']): Promise<any>;
    findMany(options?: Args['findMany']): Promise<any[]>;
    create(options: Args['create']): Promise<any>;
    update(options: Args['update']): Promise<any>;
    delete(options: Args['delete']): Promise<any>;
    count(options?: any): Promise<number>;
}
