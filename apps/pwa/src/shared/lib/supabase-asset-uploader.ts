import { file } from "opfs-tools";
import { supabaseClient, ASSETS_BUCKET } from "./supabase-client";
import { Asset } from "@/entities/asset/domain/asset";
import { Result } from "@/shared/core";

export interface SupabaseAssetRecord {
  id: string;
  hash: string;
  name: string;
  size_byte: number;
  mime_type: string;
  file_path: string;
  session_id: string | null;
  character_id: string | null;
  scenario_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetUploadContext {
  sessionId?: string | null;
  characterId?: string | null;
  scenarioId?: string | null;
}

/**
 * Upload an asset to Supabase Storage and insert metadata into astrsk_assets table
 * @param asset - The asset to upload
 * @param context - Optional foreign key context for cascade delete (sessionId, characterId, scenarioId)
 */
export async function uploadAssetToSupabase(
  asset: Asset,
  context?: AssetUploadContext,
): Promise<Result<SupabaseAssetRecord>> {
  try {
    // Get asset file from OPFS
    const assetFile = await file(asset.props.filePath).getOriginFile();
    if (!assetFile) {
      return Result.fail("Asset file not found");
    }

    // Generate storage path: {asset_id}.{extension}
    // Use only asset ID to avoid issues with non-ASCII characters in filenames
    const extension = asset.props.name.split('.').pop() || 'bin';
    const storagePath = `${asset.id.toString()}.${extension}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseClient.storage
      .from(ASSETS_BUCKET)
      .upload(storagePath, assetFile, {
        contentType: asset.props.mimeType,
        upsert: true, // Overwrite if exists to avoid conflicts
      });

    if (uploadError) {
      console.error(`Failed to upload asset ${asset.id.toString()}:`, {
        error: uploadError,
        path: storagePath,
        mimeType: asset.props.mimeType,
      });
      return Result.fail(
        `Failed to upload asset to storage: ${uploadError.message}`,
      );
    }

    // Insert metadata into astrsk_assets table
    // Store only the relative path (after bucket name) so the hub can construct
    // the full URL using its own getStorageUrl() function
    const assetRecord: Omit<SupabaseAssetRecord, "created_at" | "updated_at"> =
    {
      id: asset.id.toString(),
      hash: asset.props.hash,
      name: asset.props.name,
      size_byte: asset.props.sizeByte,
      mime_type: asset.props.mimeType,
      file_path: storagePath, // Relative path only: {asset_id}/{filename}
      session_id: context?.sessionId ?? null,
      character_id: context?.characterId ?? null,
      scenario_id: context?.scenarioId ?? null,
    };

    const { data: insertData, error: insertError } = await supabaseClient
      .from("astrsk_assets")
      .insert(assetRecord)
      .select()
      .single();

    if (insertError) {
      // If row already exists, fetch it instead
      if (insertError.code === "23505") {
        // Unique violation
        const { data: existingData, error: selectError } = await supabaseClient
          .from("astrsk_assets")
          .select()
          .eq("id", asset.id.toString())
          .single();

        if (selectError) {
          return Result.fail(
            `Failed to get existing asset: ${selectError.message}`,
          );
        }

        return Result.ok(existingData as SupabaseAssetRecord);
      }

      return Result.fail(
        `Failed to insert asset metadata: ${insertError.message}`,
      );
    }

    return Result.ok(insertData as SupabaseAssetRecord);
  } catch (error) {
    return Result.fail(`Unexpected error uploading asset: ${error}`);
  }
}
