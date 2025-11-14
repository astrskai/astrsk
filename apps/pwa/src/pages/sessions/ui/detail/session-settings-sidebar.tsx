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

interface SessionSettingsSidebarProps {
  session: Session;
  isOpen: boolean;
  onClose: () => void;
}

export default function SessionSettingsSidebar({
  session,
  isOpen,
  onClose,
}: SessionSettingsSidebarProps) {
  const { data: flow, isLoading: isLoadingFlow } = useFlow(session?.flowId);

  const { backgroundMap } = useBackgroundStore();
  const background = backgroundMap.get(session.backgroundId?.toString() ?? "");
  const [backgroundAsset] = useAsset(background?.assetId);
  // const [backgroundAsset] = useAsset(background?.assetId);
  // const backgroundSrc =
  //   backgroundAsset ??
  //   (background && "src" in background ? background.src : "");

  return (
    <aside
      className={cn(
        "bg-background-primary fixed top-0 right-0 z-30 h-full w-90 overflow-y-auto",
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

      <div className="space-y-4 p-4 [&>section]:flex [&>section]:flex-col [&>section]:gap-4">
        <section>
          <h3>AI Characters</h3>
          <div></div>
        </section>

        <section>
          <h3>User Character</h3>
          <div></div>
        </section>

        <section>
          <h3>Scenario</h3>
          <div></div>
        </section>

        <section>
          <h3>Workflow</h3>
          <div>
            {isLoadingFlow ? (
              <Loading size="sm" />
            ) : (
              <div className="rounded-lg border border-gray-500 p-2">
                {flow?.props.name ?? "No flow selected"}
              </div>
            )}
          </div>
        </section>

        <section>
          <h3>Background image</h3>
          <div>
            <img
              className="h-full w-full rounded-lg object-cover"
              src={
                background && isDefaultBackground(background)
                  ? background.src
                  : (backgroundAsset ?? "")
              }
              alt="Background image"
            />
          </div>
        </section>

        <section>
          <h3>Message styling</h3>
          <div></div>
        </section>
      </div>
    </aside>
  );
}
