import { Result } from "@/shared/core";
import { supabaseClient } from "@/shared/lib/supabase-client";

/**
 * Homepage banner data from Harpy Chat Hub
 * Represents a featured session in the banner carousel
 */
export interface HomepageBannerData {
  id: string;
  session_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  session: {
    id: string;
    title: string;
    name: string | null;
    summary: string | null;
    tags: string[] | null;
    cover_id: string | null;
    cover_asset: {
      file_path: string;
    } | null;
  } | null;
}

/**
 * Homepage section data from Harpy Chat Hub
 */
export interface HomepageSectionData {
  id: string;
  section_type: string;
  title: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Homepage section item (can reference session or character)
 */
export interface HomepageSectionItemData {
  id: string;
  section_id: string;
  session_id: string | null;
  character_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Session data for featured sessions
 */
export interface FeaturedSessionData {
  id: string;
  title: string;
  name: string | null;
  summary: string | null;
  tags: string[] | null;
  cover_id: string | null;
  created_at: string;
  updated_at: string;
  cover_asset: {
    file_path: string;
  } | null;
}

/**
 * Character data for featured characters
 */
export interface FeaturedCharacterData {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  icon_asset_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  icon_asset: {
    file_path: string;
  } | null;
}

/**
 * Fetch homepage banner sessions from Harpy Chat Hub
 * Returns up to 3 active banner sessions ordered by display_order
 */
export async function fetchHomepageBannerSessions(
  limit = 3,
): Promise<Result<HomepageBannerData[]>> {
  try {
    console.log("[fetchHomepageBannerSessions] Starting fetch with limit:", limit);

    const { data, error } = await supabaseClient
      .from("homepage_banners")
      .select(
        `
        id,
        session_id,
        display_order,
        is_active,
        created_at,
        updated_at,
        session:astrsk_sessions!session_id(
          id,
          title,
          name,
          summary,
          tags,
          cover_id,
          cover_asset:astrsk_assets!cover_id(
            file_path
          )
        )
      `,
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[fetchHomepageBannerSessions] Error:", error);
      return Result.fail(`Failed to fetch homepage banners: ${error.message}`);
    }

    if (!data) {
      console.warn("[fetchHomepageBannerSessions] No data returned");
      return Result.ok([]);
    }

    console.log("[fetchHomepageBannerSessions] Raw data:", data);

    // Transform Supabase response to proper type
    const banners = data.map((banner) => ({
      id: banner.id,
      session_id: banner.session_id,
      display_order: banner.display_order,
      is_active: banner.is_active,
      created_at: banner.created_at,
      updated_at: banner.updated_at,
      session: Array.isArray(banner.session) && banner.session.length > 0
        ? {
            id: banner.session[0].id,
            title: banner.session[0].title,
            name: banner.session[0].name,
            summary: banner.session[0].summary,
            tags: banner.session[0].tags,
            cover_id: banner.session[0].cover_id,
            cover_asset: Array.isArray(banner.session[0].cover_asset) && banner.session[0].cover_asset.length > 0
              ? banner.session[0].cover_asset[0]
              : null,
          }
        : null,
    })) as HomepageBannerData[];

    return Result.ok(banners);
  } catch (error) {
    return Result.fail(`Unexpected error fetching homepage banners: ${error}`);
  }
}

/**
 * Fetch single session details from Harpy Chat Hub by ID
 * Returns session with all metadata for preview
 */
export async function fetchCloudSessionById(
  sessionId: string,
): Promise<Result<HomepageBannerData["session"]>> {
  try {
    const { data, error } = await supabaseClient
      .from("astrsk_sessions")
      .select(
        `
        id,
        title,
        name,
        summary,
        tags,
        cover_id,
        cover_asset:astrsk_assets!cover_id(
          file_path
        )
      `,
      )
      .eq("id", sessionId)
      .single();

    if (error) {
      return Result.fail(`Failed to fetch session: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Session not found");
    }

    // Transform Supabase response
    const session = {
      id: data.id,
      title: data.title,
      name: data.name,
      summary: data.summary,
      tags: data.tags,
      cover_id: data.cover_id,
      cover_asset: Array.isArray(data.cover_asset) && data.cover_asset.length > 0
        ? data.cover_asset[0]
        : null,
    };

    return Result.ok(session);
  } catch (error) {
    return Result.fail(`Unexpected error fetching session: ${error}`);
  }
}

/**
 * Fetch single character details from Harpy Chat Hub by ID
 * Returns character with all metadata for preview
 */
export async function fetchCloudCharacterById(
  characterId: string,
): Promise<Result<FeaturedCharacterData>> {
  try {
    const { data, error } = await supabaseClient
      .from("astrsk_characters")
      .select(
        `
        id,
        name,
        description,
        tags,
        icon_asset_id,
        is_public,
        created_at,
        updated_at,
        icon_asset:astrsk_assets!icon_asset_id(
          file_path
        )
      `,
      )
      .eq("id", characterId)
      .single();

    if (error) {
      return Result.fail(`Failed to fetch character: ${error.message}`);
    }

    if (!data) {
      return Result.fail("Character not found");
    }

    // Transform Supabase response (handle both object and array from Supabase)
    const iconAsset = Array.isArray(data.icon_asset)
      ? (data.icon_asset.length > 0 ? data.icon_asset[0] : null)
      : data.icon_asset;

    const character: FeaturedCharacterData = {
      id: data.id,
      name: data.name,
      description: data.description,
      tags: data.tags,
      icon_asset_id: data.icon_asset_id,
      is_public: data.is_public,
      created_at: data.created_at,
      updated_at: data.updated_at,
      icon_asset: iconAsset,
    };

    return Result.ok(character);
  } catch (error) {
    return Result.fail(`Unexpected error fetching character: ${error}`);
  }
}

/**
 * Fetch featured sessions from homepage_sections
 * Gets sessions from the "featured_sessions" section
 */
export async function fetchFeaturedSessions(
  limit = 3,
): Promise<Result<FeaturedSessionData[]>> {
  try {
    // Step 1: Find the featured_sessions section
    const { data: sectionData, error: sectionError } = await supabaseClient
      .from("homepage_sections")
      .select("id, content_type, title")
      .eq("content_type", "sessions")
      .eq("title", "featured_sessions")
      .single();

    if (sectionError) {
      return Result.fail(
        `Failed to fetch featured_sessions section: ${sectionError.message}`,
      );
    }

    if (!sectionData) {
      return Result.ok([]);
    }

    // Step 2: Get session IDs from section items (using content_id)
    const { data: itemsData, error: itemsError } = await supabaseClient
      .from("homepage_section_items")
      .select("content_id, display_order")
      .eq("section_id", sectionData.id)
      .not("content_id", "is", null)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (itemsError) {
      return Result.fail(
        `Failed to fetch section items: ${itemsError.message}`,
      );
    }

    if (!itemsData || itemsData.length === 0) {
      return Result.ok([]);
    }

    const sessionIds = itemsData
      .map((item) => item.content_id)
      .filter((id): id is string => id !== null);

    // Step 3: Fetch session details
    const { data: sessionsData, error: sessionsError } = await supabaseClient
      .from("astrsk_sessions")
      .select(
        `
        id,
        title,
        name,
        summary,
        tags,
        cover_id,
        created_at,
        updated_at,
        cover_asset:astrsk_assets!cover_id(
          file_path
        )
      `,
      )
      .in("id", sessionIds);

    if (sessionsError) {
      return Result.fail(
        `Failed to fetch sessions: ${sessionsError.message}`,
      );
    }

    if (!sessionsData) {
      return Result.ok([]);
    }

    // Sort sessions by original display_order and transform to proper type
    const orderedSessions = sessionIds
      .map((id) => {
        const session = sessionsData.find((s) => s.id === id);
        if (!session) return undefined;

        // Transform Supabase response to our type
        // Note: Supabase can return cover_asset as either an object or array depending on the relationship
        const coverAsset = Array.isArray(session.cover_asset)
          ? (session.cover_asset.length > 0 ? session.cover_asset[0] : null)
          : session.cover_asset;

        return {
          id: session.id,
          title: session.title,
          name: session.name,
          summary: session.summary,
          tags: session.tags,
          cover_id: session.cover_id,
          created_at: session.created_at,
          updated_at: session.updated_at,
          cover_asset: coverAsset,
        } as FeaturedSessionData;
      })
      .filter((session): session is FeaturedSessionData => session !== undefined);

    return Result.ok(orderedSessions);
  } catch (error) {
    return Result.fail(`Unexpected error fetching featured sessions: ${error}`);
  }
}

/**
 * Fetch featured characters from homepage_sections
 * Gets characters from the "featured_characters" section (even if private)
 */
export async function fetchFeaturedCharacters(
  limit = 4,
): Promise<Result<FeaturedCharacterData[]>> {
  try {
    // Step 1: Find the featured_characters section
    const { data: sectionData, error: sectionError } = await supabaseClient
      .from("homepage_sections")
      .select("id, content_type, title")
      .eq("content_type", "characters")
      .eq("title", "featured_characters")
      .single();

    if (sectionError) {
      return Result.fail(
        `Failed to fetch featured_character section: ${sectionError.message}`,
      );
    }

    if (!sectionData) {
      return Result.ok([]);
    }

    // Step 2: Get character IDs from section items (using content_id)
    const { data: itemsData, error: itemsError } = await supabaseClient
      .from("homepage_section_items")
      .select("content_id, display_order")
      .eq("section_id", sectionData.id)
      .not("content_id", "is", null)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (itemsError) {
      return Result.fail(
        `Failed to fetch section items: ${itemsError.message}`,
      );
    }

    if (!itemsData || itemsData.length === 0) {
      return Result.ok([]);
    }

    const characterIds = itemsData
      .map((item) => item.content_id)
      .filter((id): id is string => id !== null);

    // Step 3: Fetch character details (including private ones)
    const { data: charactersData, error: charactersError } =
      await supabaseClient
        .from("astrsk_characters")
        .select(
          `
        id,
        name,
        description,
        tags,
        icon_asset_id,
        is_public,
        created_at,
        updated_at,
        icon_asset:astrsk_assets!icon_asset_id(
          file_path
        )
      `,
        )
        .in("id", characterIds);

    if (charactersError) {
      return Result.fail(
        `Failed to fetch characters: ${charactersError.message}`,
      );
    }

    if (!charactersData) {
      return Result.ok([]);
    }

    // Sort characters by original display_order and transform to proper type
    const orderedCharacters = characterIds
      .map((id) => {
        const char = charactersData.find((c) => c.id === id);
        if (!char) return undefined;

        // Transform Supabase response to our type
        // Note: Supabase can return icon_asset as either an object or array depending on the relationship
        const iconAsset = Array.isArray(char.icon_asset)
          ? (char.icon_asset.length > 0 ? char.icon_asset[0] : null)
          : char.icon_asset;

        return {
          id: char.id,
          name: char.name,
          description: char.description,
          tags: char.tags,
          icon_asset_id: char.icon_asset_id,
          is_public: char.is_public,
          created_at: char.created_at,
          updated_at: char.updated_at,
          icon_asset: iconAsset,
        } as FeaturedCharacterData;
      })
      .filter((char): char is FeaturedCharacterData => char !== undefined);

    return Result.ok(orderedCharacters);
  } catch (error) {
    return Result.fail(`Unexpected error fetching featured characters: ${error}`);
  }
}
