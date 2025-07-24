import { Result } from "@/shared/core";

export interface WithChanges {
  changes: Changes;
}

export class Changes {
  private changes: Result<any>[];

  constructor() {
    this.changes = [];
  }

  public addChange(result: Result<any>): void {
    this.changes.push(result);
  }

  public getCombinedChangesResult(): Result<any> {
    return Result.combine(this.changes);
  }
}
