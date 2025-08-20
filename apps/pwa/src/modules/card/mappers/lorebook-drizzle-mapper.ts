import { Lorebook } from "@/modules/card/domain/lorebook";

export class LorebookDrizzleMapper {
  private constructor() {}

  /**
   * Convert domain Lorebook to persistence format (JSON)
   */
  public static toPersistence(lorebook: Lorebook): any {
    return lorebook.toJSON();
  }

  /**
   * Convert persistence format (JSON) to domain Lorebook
   */
  public static toDomain(data: any): Lorebook {
    return Lorebook.fromJSON(data).throwOnFailure().getValue();
  }
}