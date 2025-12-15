import { Result, UseCase } from '@/shared/core';
import { UniqueEntityID } from '@/shared/domain';
import {
  ShareLinkResult,
  uploadSessionToCloud,
  uploadCharacterToCloud,
  uploadScenarioToCloud,
  uploadFlowToCloud,
  createSharedResource,
} from '@/shared/lib/cloud-upload-helpers';
import { uploadAssetToSupabase } from '@/shared/lib/supabase-asset-uploader';
import { DEFAULT_SHARE_EXPIRATION_DAYS } from '@/shared/lib/supabase-client';

import { PrepareSessionCloudData } from './prepare-session-cloud-data';
import { CloneSession } from './clone-session';
import { DeleteSession } from './delete-session';
import { LoadSessionRepo, SaveSessionRepo } from '@/entities/session/repos';
import { LoadAssetRepo } from '@/entities/asset/repos/load-asset-repo';
import { SaveAssetRepo } from '@/entities/asset/repos/save-asset-repo';
import { Asset } from '@/entities/asset/domain/asset';
import { getDefaultBackground } from '@/entities/background/api/query-factory';
import { write } from 'opfs-tools';

interface Command {
  sessionId: UniqueEntityID;
  expirationDays?: number;
  /** Optional predefined cloned session ID (avoids popup blocker by allowing immediate URL construction) */
  clonedSessionId?: UniqueEntityID;
}

/**
 * Export a complete session (with all cards, flow, nodes, and backgrounds) to cloud storage
 * and create a shareable link
 *
 * Strategy:
 * 1. Load original session to preserve its name
 * 2. Clone the session locally (generates new UUIDs for session and all resources including backgrounds)
 * 3. Restore original name to cloned session (not "Copy of...")
 * 4. Save the updated cloned session to database
 * 5. Export the cloned session to cloud
 * 6. Delete the cloned session and all its resources
 */
export class ExportSessionToCloud
  implements UseCase<Command, Result<ShareLinkResult>> {
  constructor(
    private cloneSession: CloneSession,
    private deleteSession: DeleteSession,
    private prepareSessionData: PrepareSessionCloudData,
    private loadSessionRepo: LoadSessionRepo,
    private saveSessionRepo: SaveSessionRepo,
    private loadAssetRepo: LoadAssetRepo,
    private saveAssetRepo: SaveAssetRepo,
  ) { }

  async execute({
    sessionId,
    expirationDays = DEFAULT_SHARE_EXPIRATION_DAYS,
    clonedSessionId: providedClonedSessionId,
  }: Command): Promise<Result<ShareLinkResult>> {
    // Use provided cloned session ID (for immediate URL construction) or generate new one
    const clonedSessionId = providedClonedSessionId ?? new UniqueEntityID();

    try {
      // 0. Load the original session to get the original name
      const originalSessionResult = await this.loadSessionRepo.getSessionById(sessionId);
      if (originalSessionResult.isFailure) {
        return Result.fail<ShareLinkResult>(
          `Failed to load original session: ${originalSessionResult.getError()}`
        );
      }
      const originalSession = originalSessionResult.getValue();
      const originalName = originalSession.props.name;

      // 1. Clone the session with predefined ID to avoid popup blocker issues
      // Don't include chat history - we only want the structure
      const cloneResult = await this.cloneSession.execute({
        sessionId,
        includeHistory: false,
        clonedSessionId, // Use predefined ID
      });

      if (cloneResult.isFailure) {
        return Result.fail<ShareLinkResult>(cloneResult.getError());
      }

      const clonedSession = cloneResult.getValue();

      // 1a. Restore original name (not "Copy of...")
      const updateResult = clonedSession.update({
        name: originalName,
        title: originalName, // Keep title in sync
      });

      if (updateResult.isFailure) {
        return Result.fail<ShareLinkResult>(
          `Failed to restore original session name: ${updateResult.getError()}`
        );
      }

      // 1b. Save the updated session to database
      const saveResult = await this.saveSessionRepo.saveSession(clonedSession);
      if (saveResult.isFailure) {
        return Result.fail<ShareLinkResult>(
          `Failed to save session with restored name: ${saveResult.getError()}`
        );
      }

      // Small delay to ensure database writes are committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Prepare all session data (session, cards, flow, nodes, backgrounds) using the CLONED session ID
      const bundleResult = await this.prepareSessionData.execute({ sessionId: clonedSessionId });
      if (bundleResult.isFailure) {
        return Result.fail<ShareLinkResult>(bundleResult.getError());
      }

      const bundle = bundleResult.getValue();

      // 3. Upload assets FIRST (WITHOUT back-reference FKs to avoid circular dependency)
      // Assets have FKs to session/character/scenario, AND session/character/scenario have FKs to assets
      // Solution: Upload assets with null FKs first, then upload entities that reference them

      // 3a. Upload session assets (background, cover) - no session_id FK yet
      if (bundle.session.background_id) {
        const backgroundId = new UniqueEntityID(bundle.session.background_id);

        // Try to load the background asset from local storage
        let backgroundAsset = await this.loadAssetRepo.getAssetById(backgroundId);

        // If not found locally, check if it's a default background and download it
        if (backgroundAsset.isFailure) {
          const defaultBackground = getDefaultBackground(backgroundId);

          if (defaultBackground && defaultBackground.src) {
            console.log(`[EXPORT] Downloading default background from CDN: ${defaultBackground.name}`);

            try {
              // Download the background image from CDN
              const response = await fetch(defaultBackground.src);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              const blob = await response.blob();
              const filename = `${defaultBackground.name.replace(/\s+/g, '_')}.jpg`;
              const filePath = `backgrounds/${backgroundId.toString()}/${filename}`;

              // Create Asset entity
              const assetResult = Asset.create({
                hash: `default-bg-${backgroundId.toString()}`,
                name: filename,
                sizeByte: blob.size,
                mimeType: blob.type || 'image/jpeg',
                filePath: filePath,
                updatedAt: new Date(),
              }, backgroundId);

              if (assetResult.isFailure) {
                throw new Error(assetResult.getError());
              }

              const asset = assetResult.getValue();

              // Save to OPFS
              await write(filePath, blob.stream());

              // Save to database
              const saveResult = await this.saveAssetRepo.saveAsset(asset);
              if (saveResult.isFailure) {
                throw new Error(saveResult.getError());
              }

              backgroundAsset = Result.ok(asset);
              console.log(`[EXPORT] Downloaded and saved default background: ${filename}`);
            } catch (error) {
              console.error(`[EXPORT] Failed to download default background:`, error);
              bundle.session.background_id = null;
            }
          } else {
            // Neither local asset nor default background - clear reference
            console.log(`[EXPORT] Background not found, clearing reference: ${bundle.session.background_id}`);
            bundle.session.background_id = null;
          }
        }

        // Upload the background asset to Supabase
        if (backgroundAsset.isSuccess) {
          const uploadResult = await uploadAssetToSupabase(backgroundAsset.getValue());
          if (uploadResult.isFailure) {
            return Result.fail<ShareLinkResult>(
              `Failed to upload background asset: ${uploadResult.getError()}`
            );
          }
          console.log(`[EXPORT] Uploaded background asset: ${bundle.session.background_id}`);
        }
      }
      if (bundle.session.cover_id) {
        const coverAsset = await this.loadAssetRepo.getAssetById(
          new UniqueEntityID(bundle.session.cover_id)
        );
        if (coverAsset.isSuccess) {
          const uploadResult = await uploadAssetToSupabase(coverAsset.getValue());
          if (uploadResult.isFailure) {
            return Result.fail<ShareLinkResult>(
              `Failed to upload cover asset: ${uploadResult.getError()}`
            );
          }
        } else {
          // Asset not found locally - clear the reference so session can be uploaded
          bundle.session.cover_id = null;
        }
      }

      // 3b. Upload character icon assets - no character_id FK yet
      for (const character of bundle.characters) {
        if (character.icon_asset_id) {
          const iconAsset = await this.loadAssetRepo.getAssetById(
            new UniqueEntityID(character.icon_asset_id)
          );
          if (iconAsset.isSuccess) {
            const uploadResult = await uploadAssetToSupabase(iconAsset.getValue());
            if (uploadResult.isFailure) {
              return Result.fail<ShareLinkResult>(
                `Failed to upload character icon asset: ${uploadResult.getError()}`
              );
            }
          } else {
            // Asset not found locally - clear the reference so character can be uploaded
            character.icon_asset_id = null;
          }
        }
      }

      // 3c. Upload scenario icon assets - no scenario_id FK yet
      for (const scenario of bundle.scenarios) {
        if (scenario.icon_asset_id) {
          const iconAsset = await this.loadAssetRepo.getAssetById(
            new UniqueEntityID(scenario.icon_asset_id)
          );
          if (iconAsset.isSuccess) {
            const uploadResult = await uploadAssetToSupabase(iconAsset.getValue());
            if (uploadResult.isFailure) {
              return Result.fail<ShareLinkResult>(
                `Failed to upload scenario icon asset: ${uploadResult.getError()}`
              );
            }
          } else {
            // Asset not found locally - clear the reference so scenario can be uploaded
            scenario.icon_asset_id = null;
          }
        }
      }

      // 4. Upload session (assets already exist, background_id/cover_id FKs are valid)
      const sessionUploadResult = await uploadSessionToCloud(bundle.session);
      if (sessionUploadResult.isFailure) {
        return Result.fail<ShareLinkResult>(sessionUploadResult.getError());
      }

      // 5. Upload all characters (icon assets already exist)
      for (const character of bundle.characters) {
        const uploadResult = await uploadCharacterToCloud(character);
        if (uploadResult.isFailure) {
          return Result.fail<ShareLinkResult>(
            `Failed to upload character ${character.id}: ${uploadResult.getError()}`
          );
        }
      }

      // 6. Upload all scenarios (icon assets already exist)
      for (const scenario of bundle.scenarios) {
        const uploadResult = await uploadScenarioToCloud(scenario);
        if (uploadResult.isFailure) {
          return Result.fail<ShareLinkResult>(
            `Failed to upload scenario ${scenario.id}: ${uploadResult.getError()}`
          );
        }
      }

      // 7. Upload flow and all its nodes (if session has a flow)
      if (bundle.flow) {
        const flowUploadResult = await uploadFlowToCloud(
          bundle.flow,
          bundle.agents,
          bundle.dataStoreNodes,
          bundle.ifNodes
        );
        if (flowUploadResult.isFailure) {
          return Result.fail<ShareLinkResult>(flowUploadResult.getError());
        }
      }

      // 8. Create shared resource entry using the NEW session ID
      const shareResult = await createSharedResource(
        'session',
        clonedSessionId.toString(),
        expirationDays
      );
      if (shareResult.isFailure) {
        return Result.fail<ShareLinkResult>(shareResult.getError());
      }

      return shareResult;
    } catch (error) {
      return Result.fail<ShareLinkResult>(
        `Unexpected error exporting session to cloud: ${error}`
      );
    } finally {
      // 9. Cleanup: Delete the temporary cloned session and all its resources (cards, flow, nodes, backgrounds)
      if (clonedSessionId) {
        try {
          await this.deleteSession.execute(clonedSessionId);
        } catch (cleanupError) {
          console.error(
            `Failed to cleanup temporary session ${clonedSessionId}:`,
            cleanupError,
          );
          // Don't fail the operation if cleanup fails, but log it
        }
      }
    }
  }
}
