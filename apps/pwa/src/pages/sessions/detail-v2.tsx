import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

import { Route } from "@/routes/_layout/sessions/$sessionId";
import { sessionQueries } from "@/entities/session/api";
import { flowQueries } from "@/entities/flow/api";
import { DataStoreSchemaField } from "@/entities/flow/domain";

import { useBackgroundStore } from "@/shared/stores/background-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { UniqueEntityID } from "@/shared/domain";
import { Loading } from "@/shared/ui";
import {
  ChatMainArea,
  SessionDataSidebar,
  SessionHeader,
  SessionSettingsSidebar,
} from "./ui/detail";
import { turnQueries } from "@/entities/turn/api/turn-queries";
import { DataStoreSavedField } from "@/entities/turn/domain/option";
import { AutoReply } from "@/shared/stores/session-store";
import { useSaveSession } from "@/entities/session/api/mutations";

export default function SessionDetailPage() {
  const [isOpenSessionDataSidebar, setIsOpenSessionDataSidebar] =
    useState<boolean>(false);
  const [isOpenSettings, setIsOpenSettings] = useState<boolean>(false);

  const saveSessionMutation = useSaveSession();

  const { sessionId } = Route.useParams();
  const sessionIdEntity = sessionId as unknown as UniqueEntityID;

  const { data: session, isLoading } = useQuery(
    sessionQueries.detail(sessionIdEntity ?? undefined),
  );

  const { data: flow } = useQuery(
    flowQueries.detail(session?.flowId?.toString() ?? ""),
  );

  const { data: lastTurn } = useQuery(
    turnQueries.detail(
      session?.turnIds[session?.turnIds.length - 1] ?? undefined,
    ),
  );

  // Background
  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(
    session?.props.backgroundId?.toString() ?? "",
  );
  const [backgroundAsset] = useAsset(background?.assetId);
  const backgroundSrc =
    backgroundAsset ??
    (background && "src" in background ? background.src : "");

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

      await saveSessionMutation.mutate({
        session: session,
      });
    },
    [session, saveSessionMutation],
  );

  const handleAutoReplyClick = useCallback(() => {
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
        throw new Error("Unknown auto reply");
    }
  }, [
    updateAutoReply,
    session?.aiCharacterCardIds?.length,
    session?.autoReply,
  ]);

  return isLoading ? (
    <Loading />
  ) : session ? (
    <div className="relative z-0 flex h-dvh flex-col">
      {shouldShowBackground && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat opacity-60"
          style={{ backgroundImage: `url(${backgroundSrc})` }}
        />
      )}

      <SessionHeader
        title={session.title ?? "Session"}
        isOpenDataSidebar={isOpenSessionDataSidebar}
        onDataSidebarClick={() => setIsOpenSessionDataSidebar((prev) => !prev)}
        onSettingsClick={() => setIsOpenSettings(true)}
      />

      <div className="flex flex-1">
        <SessionDataSidebar
          session={session}
          isOpen={isOpenSessionDataSidebar}
          sortedDataSchemaFields={sortedDataSchemaFields}
          isInitialDataStore={isInitialDataStore}
          lastTurnDataStore={lastTurnDataStore}
          savedLayout={session.widgetLayout}
        />

        <ChatMainArea
          data={session}
          isOpenStats={isOpenSessionDataSidebar}
          onOpenStats={setIsOpenSessionDataSidebar}
          onAutoReply={handleAutoReplyClick}
        />
      </div>

      <SessionSettingsSidebar
        session={session}
        isOpen={isOpenSettings}
        onAutoReply={handleAutoReplyClick}
        onClose={() => setIsOpenSettings(false)}
      />
    </div>
  ) : (
    <div className="flex h-full items-center justify-center">
      <p className="text-text-secondary text-center text-xl leading-8 font-normal">
        Not found session
      </p>
    </div>
  );
}
