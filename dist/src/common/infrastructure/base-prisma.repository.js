"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePrismaRepository = void 0;
class BasePrismaRepository {
    delegate;
    constructor(delegate) {
        this.delegate = delegate;
    }
    async findUnique(options) {
        return this.delegate.findUnique(options);
    }
    async findMany(options) {
        return this.delegate.findMany(options);
    }
    async create(options) {
        return this.delegate.create(options);
    }
    async update(options) {
        return this.delegate.update(options);
    }
    async delete(options) {
        return this.delegate.delete(options);
    }
    async count(options) {
        return this.delegate.count(options);
    }
}
exports.BasePrismaRepository = BasePrismaRepository;
//# sourceMappingURL=base-prisma.repository.js.map