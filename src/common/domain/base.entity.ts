import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntity {
  id: string = uuidv4();
  createdAt: Date = new Date();
  updatedAt: Date = new Date();
}
