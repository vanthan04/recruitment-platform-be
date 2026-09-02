import { randomUUID } from 'crypto';

export abstract class BaseEntity {
  id: string = randomUUID();
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
