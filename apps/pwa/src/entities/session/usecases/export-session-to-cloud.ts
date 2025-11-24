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
import { LoadAssetRepo } from '@/entities/asset/repos/load-asset-repo';

interface Command {
  sessionId: UniqueEntityID;
  expirationDays?: number;
}

/**
 * Export a complete session (with all cards, flow, nodes, and backgrounds) to cloud storage
 * and create a shareable link
 *
 * Strategy:
 * 1. Clone the session locally (generates new UUIDs for session and all resources including backgrounds)
 * 2. Export the cloned session to cloud
 * 3. Delete the cloned session and all its resources
 */
export class ExportSessionToCloud
  implements UseCase<Command, Result<ShareLinkResult>> {
  constructor(
    private cloneSession: CloneSession,
    private deleteSession: DeleteSession,
    private prepareSessionData: PrepareSessionCloudData,
    private loadAssetRepo: LoadAssetRepo,
  ) { }

  async execute({
    sessionId,
    expirationDays = DEFAULT_SHARE_EXPIRATION_DAYS,
  }: Command): Promise<Result<ShareLinkResult>> {
    let clonedSessionId: UniqueEntityID | null = null;

    try {
      // 1. Clone the session to generate new IDs for all resources
      // Don't include chat history - we only want the structure
      const cloneResult = await this.cloneSession.execute({
        sessionId,
        includeHistory: false,
      });

      if (cloneResult.isFailure) {
        return Result.fail<ShareLinkResult>(cloneResult.getError());
      }

      const clonedSession = cloneResult.getValue();
      clonedSessionId = clonedSession.id;

      // Small delay to ensure database writes are committed
      await new Promise((resolve) => setTimeout(resolve, 100));

      // 2. Prepare all session data (session, cards, flow, nodes, backgrounds) using the CLONED session ID
      const bundleResult = await this.prepareSessionData.execute({ sessionId: clonedSessionId });
      if (bundleResult.isFailure) {
        return Result.fail<ShareLinkResult>(bundleResult.getError());
      }

      const bundle = bundleResult.getValue();

      // 3. Upload session (with asset ID references set)
      const sessionUploadResult = await uploadSessionToCloud(bundle.session);
      if (sessionUploadResult.isFailure) {
        return Result.fail<ShareLinkResult>(sessionUploadResult.getError());
      }

      // 4. Upload all characters (with asset ID references set)
      for (const character of bundle.characters) {
        const uploadResult = await uploadCharacterToCloud(character);
        if (uploadResult.isFailure) {
          return Result.fail<ShareLinkResult>(
            `Failed to upload character ${character.id}: ${uploadResult.getError()}`
          );
        }
      }

      // 5. Upload all scenarios (with asset ID references set)
      for (const scenario of bundle.scenarios) {
        const uploadResult = await uploadScenarioToCloud(scenario);
        if (uploadResult.isFailure) {
          return Result.fail<ShareLinkResult>(
            `Failed to upload scenario ${scenario.id}: ${uploadResult.getError()}`
          );
        }
      }

      // 6. Now upload the actual assets with correct FKs
      // 6a. Upload session assets (background, cover)
      if (bundle.session.background_id) {
        const backgroundAsset = await this.loadAssetRepo.getAssetById(
          new UniqueEntityID(bundle.session.background_id)
        );
        if (backgroundAsset.isSuccess) {
          await uploadAssetToSupabase(backgroundAsset.getValue(), {
            sessionId: bundle.session.id,
          });
        }
      }
      if (bundle.session.cover_id) {
        const coverAsset = await this.loadAssetRepo.getAssetById(
          new UniqueEntityID(bundle.session.cover_id)
        );
        if (coverAsset.isSuccess) {
          await uploadAssetToSupabase(coverAsset.getValue(), {
            sessionId: bundle.session.id,
          });
        }
      }

      // 6b. Upload character icon assets
      for (const character of bundle.characters) {
        if (character.icon_asset_id) {
          const iconAsset = await this.loadAssetRepo.getAssetById(
            new UniqueEntityID(character.icon_asset_id)
          );
          if (iconAsset.isSuccess) {
            await uploadAssetToSupabase(iconAsset.getValue(), {
              characterId: character.id,
              sessionId: character.session_id,
            });
          }
        }
      }

      // 6c. Upload scenario icon assets
      for (const scenario of bundle.scenarios) {
        if (scenario.icon_asset_id) {
          const iconAsset = await this.loadAssetRepo.getAssetById(
            new UniqueEntityID(scenario.icon_asset_id)
          );
          if (iconAsset.isSuccess) {
            await uploadAssetToSupabase(iconAsset.getValue(), {
              scenarioId: scenario.id,
              sessionId: scenario.session_id,
            });
          }
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
