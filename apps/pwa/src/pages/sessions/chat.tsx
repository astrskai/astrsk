import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { Route } from "@/routes/_layout/sessions/$sessionId";
import { sessionQueries } from "@/entities/session/api";
import { flowQueries } from "@/entities/flow/api";
import { DataStoreSchemaField } from "@/entities/flow/domain";

import {
  backgroundQueries,
  getDefaultBackground,
  getBackgroundAssetId,
} from "@/entities/background/api";
import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain";
import { Loading } from "@/shared/ui";
import {
  ChatMainArea,
  SessionDataSidebar,
  SessionHeader,
  SessionSettingsSidebar,
} from "./ui/chat";
import { turnQueries } from "@/entities/turn/api/turn-queries";
import { DataStoreSavedField } from "@/entities/turn/domain/option";
import { AutoReply } from "@/shared/stores/session-store";
import { useSaveSession } from "@/entities/session/api/mutations";
import { useSessionConfig } from "@/shared/hooks/use-session-config";
import { usePlaySessionAuth } from "@/shared/hooks/use-play-session-auth";
import { PlaySessionLoginPage } from "@/pages/auth/play-session-login";

export default function ChatPage() {
  const saveSessionMutation = useSaveSession();

  const { sessionId } = Route.useParams();
  const sessionIdEntity = sessionId ? new UniqueEntityID(sessionId) : undefined;

  // Check if user needs authentication for play session
  const playSessionAuth = usePlaySessionAuth(sessionIdEntity);

  const { data: session, isLoading } = useQuery(
    sessionQueries.detail(sessionIdEntity),
  );

  // Session config hook - manages panel states
  const {
    isSettingsPanelOpen,
    isDataPanelOpen,
    toggleSettingsPanel,
    toggleDataPanel,
  } = useSessionConfig({
    session: session ?? null,
  });

  const { data: flow } = useQuery(
    flowQueries.detail(session?.flowId?.toString() ?? ""),
  );

  const { data: lastTurn } = useQuery(
    turnQueries.detail(
      session?.turnIds[session?.turnIds.length - 1] ?? undefined,
    ),
  );

  // Background - check if default first, then query for user background
  const backgroundId = session?.props.backgroundId;
  const defaultBg = backgroundId ? getDefaultBackground(backgroundId) : undefined;

  const { data: background } = useQuery({
    ...backgroundQueries.detail(backgroundId),
    enabled: !!backgroundId && !defaultBg,
  });

  const [backgroundAsset] = useAsset(getBackgroundAssetId(background));

  const backgroundSrc = defaultBg
    ? defaultBg.src
    : backgroundAsset ?? "";

  const isLoadingBackground = backgroundAsset === "/img/skeleton.svg";
  const shouldShowBackground = backgroundSrc && !isLoadingBackground;

  const isInitialDataStore = useMemo(() => {
    if (!session || session.turnIds.length === 0) return true;

    // Only scenario message exists if:
    // 1. There's only one message
    // 2. That message is a scenario (no characterCardId and no characterName)
    if (session.turnIds.length === 1 && lastTurn) {
      const isScenarioMessage =
        !lastTurn.characterCardId && !lastTurn.characterName;
      return isScenarioMessage;
    }

    // Multiple messages mean conversation has started
    return false;
  }, [session, lastTurn]);

  const lastTurnDataStore: Record<string, string> = useMemo(() => {
    if (!lastTurn) {
      return {};
    }
    return Object.fromEntries(
      lastTurn.dataStore.map((field: DataStoreSavedField) => [
        field.name,
        field.value,
      ]),
    );
  }, [lastTurn]);

  // Sort data schema fields according to dataSchemaOrder
  const sortedDataSchemaFields = useMemo(() => {
    const fields = flow?.props.dataStoreSchema?.fields || [];
    const dataSchemaOrder = session?.dataSchemaOrder || [];

    return [
      // 1. Fields in dataSchemaOrder come first, in order
      ...dataSchemaOrder
        .map((name: string) =>
          fields.find((f: DataStoreSchemaField) => f.name === name),
        )
        .filter(
          (f: DataStoreSchemaField | undefined): f is NonNullable<typeof f> =>
            f !== undefined,
        ),

      // 2. Fields not in dataSchemaOrder come after, in original order
      ...fields.filter(
        (f: DataStoreSchemaField) => !dataSchemaOrder.includes(f.name),
      ),
    ];
  }, [flow?.props.dataStoreSchema?.fields, session?.dataSchemaOrder]);

  const updateAutoReply = useCallback(
    async (autoReply: AutoReply) => {
      if (!session) {
        return;
      }

      session.update({
        autoReply,
      });

      await saveSessionMutation.mutateAsync({
        session: session,
      });
    },
    [session, saveSessionMutation],
  );

  const handleAutoReplyClick = useCallback(() => {
    if (saveSessionMutation.isPending) return;

    const hasMultipleCharacters =
      (session?.aiCharacterCardIds?.length ?? 0) > 1;

    switch (session?.autoReply) {
      case AutoReply.Off:
        updateAutoReply(AutoReply.Random);
        break;
      case AutoReply.Random:
        // Skip Rotate option if only one character
        updateAutoReply(
          hasMultipleCharacters ? AutoReply.Rotate : AutoReply.Off,
        );
        break;
      case AutoReply.Rotate:
        updateAutoReply(AutoReply.Off);
        break;
      default:
        console.error("Unknown auto reply value", session?.autoReply);
        updateAutoReply(AutoReply.Off);
    }
  }, [
    updateAutoReply,
    session?.aiCharacterCardIds?.length,
    session?.autoReply,
    saveSessionMutation.isPending,
  ]);

  // Wrapper function to convert toggle to the expected (isOpen: boolean) => void signature
  const handleDataPanelToggle = useCallback(
    (isOpen: boolean) => {
      // Only toggle if current state differs from desired state
      if (isDataPanelOpen !== isOpen) {
        toggleDataPanel();
      }
    },
    [isDataPanelOpen, toggleDataPanel],
  );

  // Show loading while checking auth or loading session
  if (isLoading || playSessionAuth.isLoading) {
    return <Loading />;
  }

  // Show login page if user needs authentication
  if (playSessionAuth.needsAuth) {
    return <PlaySessionLoginPage />;
  }

  return session ? (
    <div className="relative z-0 flex h-dvh flex-col overflow-hidden">
      {shouldShowBackground ? (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: `url(${backgroundSrc})` }}
        />
      ) : (
        /* Galaxy theme gradient background when no background image is selected */
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at 20% 80%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), " +
              "radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), " +
              "radial-gradient(ellipse at 50% 50%, rgba(79, 70, 229, 0.06) 0%, transparent 70%), " +
              "linear-gradient(to bottom, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)",
          }}
        >
          {/* Subtle star-like dots */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.3), transparent), " +
                "radial-gradient(1px 1px at 40px 70px, rgba(139, 92, 246, 0.4), transparent), " +
                "radial-gradient(1px 1px at 90px 40px, rgba(99, 102, 241, 0.3), transparent), " +
                "radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.2), transparent), " +
                "radial-gradient(1px 1px at 160px 20px, rgba(139, 92, 246, 0.3), transparent)",
              backgroundSize: "180px 100px",
            }}
          />
        </div>
      )}

      <SessionHeader
        title={session.name ?? "Session"}
        onSettingsClick={toggleSettingsPanel}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <SessionDataSidebar
          session={session}
          isOpen={isDataPanelOpen}
          onToggle={toggleDataPanel}
          sortedDataSchemaFields={sortedDataSchemaFields}
          isInitialDataStore={isInitialDataStore}
          lastTurnDataStore={lastTurnDataStore}
          lastTurn={lastTurn}
        />

        <ChatMainArea
          data={session}
          isOpenStats={isDataPanelOpen}
          onOpenStats={handleDataPanelToggle}
          onAutoReply={handleAutoReplyClick}
        />
      </div>

      <SessionSettingsSidebar
        session={session}
        isOpen={isSettingsPanelOpen}
        onAutoReply={handleAutoReplyClick}
        onClose={toggleSettingsPanel}
      />
    </div>
  ) : (
    <div className="flex h-full items-center justify-center">
      <p className="text-fg-muted text-center text-xl leading-8 font-normal">
        Not found session
      </p>
    </div>
  );
}
