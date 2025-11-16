import { useMemo } from "react";

import { cn } from "@/shared/lib";
import { ChevronLeft, Ellipsis, Pencil } from "lucide-react";
import { Session } from "@/entities/session/domain/session";
import {
  isDefaultBackground,
  useBackgroundStore,
} from "@/shared/stores/background-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { useFlow } from "@/shared/hooks/use-flow";
import { Loading } from "@/shared/ui";
import CharacterItem from "./settings/character-item";
import ScenarioPreview from "@/features/scenario/ui/scenario-preview";
import { PlotCard } from "@/entities/card/domain";
import { useCard } from "@/shared/hooks/use-card";
import { UniqueEntityID } from "@/shared/domain";
import FlowPreview from "@/features/flow/ui/flow-preview";
import MessageStyling from "./settings/message-styling";

interface SessionSettingsSidebarProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

const ScenarioPreviewItem = ({
  scenarioId,
}: {
  scenarioId: UniqueEntityID;
}) => {
  const [scenario] = useCard<PlotCard>(scenarioId);
  const [imageUrl] = useAsset(scenario.props.iconAssetId);

  return (
    <ScenarioPreview
      title={scenario.props.title}
      imageUrl={imageUrl}
      tags={scenario.props.tags || []}
      tokenCount={scenario.props.tokenCount}
      firstMessages={scenario.props.scenarios?.length || 0}
      className="min-h-[200px]"
    />
  );
};

export default function SessionSettingsSidebar({
  session,
  isOpen,
  onClose,
}: SessionSettingsSidebarProps) {
  const { data: flow, isLoading: isLoadingFlow } = useFlow(session?.flowId);

  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(session.backgroundId?.toString() ?? "");
  const [backgroundAsset] = useAsset(background?.assetId);

  const backgroundImageSrc = useMemo(() => {
    if (background && isDefaultBackground(background)) {
      return background.src;
    }
    return backgroundAsset; // undefined or string
  }, [background, backgroundAsset]);

  return (
    <aside
      className={cn(
        "bg-background-primary fixed top-0 right-0 z-30 h-full w-100 overflow-y-auto",
        "transition-transform duration-300 ease-in-out",
        "shadow-[-8px_0_24px_-4px_rgba(0,0,0,0.5)]",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <button
          type="button"
          aria-label="Close settings panel"
          onClick={onClose}
          className="cursor-pointer text-gray-300 hover:text-gray-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 text-base font-semibold text-gray-50">
          {session.title ?? "Untitled Session"}
          <button
            type="button"
            aria-label="Edit session title"
            className="cursor-pointer text-gray-300 hover:text-gray-50"
            onClick={() => {
              // setIsEditingTitle(true);
              // setEditedTitle(session.title ?? "");
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </span>
        <button
          type="button"
          aria-label="Close settings panel"
          onClick={onClose}
          className="cursor-pointer text-gray-300 hover:text-gray-50"
        >
          <Ellipsis className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 p-4 [&>section]:flex [&>section]:flex-col [&>section]:gap-2">
        <section>
          <h3 className="font-semibold">AI Characters</h3>
          <div className="space-y-2">
            {session.aiCharacterCardIds.length > 0 ? (
              session.aiCharacterCardIds.map((characterId) => (
                <CharacterItem
                  key={characterId.toString()}
                  characterId={characterId}
                />
              ))
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No AI characters</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">User Character</h3>
          <div>
            {session.userCharacterCardId ? (
              <CharacterItem
                key={session.userCharacterCardId.toString()}
                characterId={session.userCharacterCardId}
              />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No user character</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Scenario</h3>
          <div>
            {session.plotCard ? (
              <ScenarioPreviewItem scenarioId={session.plotCard.id} />
            ) : (
              <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No scenario</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Workflow</h3>
          <div>
            {isLoadingFlow ? (
              <Loading size="sm" />
            ) : (
              <FlowPreview
                title={flow?.props.name ?? "No flow selected"}
                description={flow?.props.description}
                nodeCount={flow?.props.nodes.length}
                className="min-h-[140px]"
              />
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Background image</h3>
          <div>
            {backgroundImageSrc ? (
              <img
                className="h-full w-full rounded-lg object-cover"
                src={backgroundImageSrc}
                alt="Background image"
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-500 bg-gray-800/50">
                <p className="text-sm text-gray-400">No background image</p>
              </div>
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold">Message styling</h3>

          <MessageStyling
            sessionId={session.id}
            chatStyles={session.chatStyles}
          />
        </section>
      </div>
    </aside>
  );
}
