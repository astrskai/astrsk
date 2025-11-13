import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Route } from "@/routes/_layout/sessions/$sessionId";
import { sessionQueries } from "@/entities/session/api";
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

export default function SessionDetailPage() {
  const [isOpenDataSidebar, setIsOpenDataSidebar] = useState<boolean>(false);
  const [isOpenSettings, setIsOpenSettings] = useState<boolean>(false);

  const { sessionId } = Route.useParams();
  const sessionIdEntity = sessionId as unknown as UniqueEntityID;

  const { data: session, isLoading } = useQuery(
    sessionQueries.detail(sessionIdEntity ?? undefined),
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
        isOpenDataSidebar={isOpenDataSidebar}
        onDataSidebarClick={() => setIsOpenDataSidebar((prev) => !prev)}
        onSettingsClick={() => setIsOpenSettings(true)}
      />

      <div className="flex flex-1">
        <SessionDataSidebar isOpen={isOpenDataSidebar} />

        <ChatMainArea data={session} />
      </div>

      <SessionSettingsSidebar
        isOpen={isOpenSettings}
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
