import { Entity } from "@/shared/domain/entity";

export abstract class AggregateRoot<T> extends Entity<T> {
  // TODO: add domain events
}
