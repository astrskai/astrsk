import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { useAsset } from "@/shared/hooks/use-asset";

/**
 * Character avatar input type - accepts iconAssetId for resolution
 */
export interface CharacterAvatarInput {
  name: string;
  iconAssetId?: string;
}

/**
 * Character avatar output type - resolved avatarUrl for design system components
 */
export interface CharacterAvatarResolved {
  name: string;
  avatarUrl?: string;
}

/**
 * Hook to resolve a single character avatar URL from iconAssetId
 * @internal Used by useCharacterAvatars
 */
function useCharacterAvatarUrl(iconAssetId?: string): string | undefined {
  const [avatarUrl] = useAsset(iconAssetId ? new UniqueEntityID(iconAssetId) : undefined);
  return avatarUrl ?? undefined;
}

/**
 * Hook to resolve multiple character avatar URLs
 * Converts { name, iconAssetId } to { name, avatarUrl } format for design system components
 *
 * Note: Due to React hooks rules, this hook resolves up to 4 avatars
 * (3 displayed + 1 for "+n" calculation in SessionCard)
 *
 * @example
 * ```tsx
 * const resolvedAvatars = useCharacterAvatars([
 *   { name: "Alice", iconAssetId: "asset-1" },
 *   { name: "Bob", iconAssetId: "asset-2" },
 * ]);
 * // Returns: [{ name: "Alice", avatarUrl: "blob:..." }, { name: "Bob", avatarUrl: "blob:..." }]
 * ```
 */
export function useCharacterAvatars(
  characterAvatars: CharacterAvatarInput[]
): CharacterAvatarResolved[] {
  // Resolve up to 4 avatars (React hooks must be called unconditionally)
  const avatar0 = useCharacterAvatarUrl(characterAvatars[0]?.iconAssetId);
  const avatar1 = useCharacterAvatarUrl(characterAvatars[1]?.iconAssetId);
  const avatar2 = useCharacterAvatarUrl(characterAvatars[2]?.iconAssetId);
  const avatar3 = useCharacterAvatarUrl(characterAvatars[3]?.iconAssetId);

  const avatarUrls = [avatar0, avatar1, avatar2, avatar3];

  return characterAvatars.map((char, idx) => ({
    name: char.name,
    avatarUrl: avatarUrls[idx],
  }));
}
