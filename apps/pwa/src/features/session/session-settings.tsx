import { Loader2, Upload, Pencil, Check, X } from "lucide-react";
import {
  forwardRef,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { downloadFile, logger } from "@/shared/utils";
import { languagesLabelMap } from "@/shared/utils/translate-utils";
import { UniqueEntityID } from "@/shared/domain";

import { useFlow } from "@/app/hooks/use-flow";
import { useSession } from "@/app/hooks/use-session";
import { useAutoSaveSession } from "@/app/hooks/use-auto-save-session";
import { SessionService } from "@/app/services/session-service";
import { useAppStore } from "@/app/stores/app-store";
import { useSessionStore } from "@/app/stores/session-store";
import { useValidationStore } from "@/app/stores/validation-store";
import { cn } from "@/components-v2/lib/utils";
import { CardTab } from "@/features/session/create-session/step-cards";
import {
  EditBackground,
  SelectedBackground,
} from "@/features/session/edit-session/edit-background";
import {
  CardListItem,
  EditCards,
  EmptyCard,
} from "@/features/session/edit-session/edit-cards";
import {
  ColorTable,
  EditChatStyling,
} from "@/features/session/edit-session/edit-chat-styling";
import {
  AgentListItem,
  EditFlowAndAgents,
  EmptyFlow,
} from "@/features/session/edit-session/edit-flow-and-agents";
import { EditLanguage } from "@/features/session/edit-session/edit-language";
import {
  SessionExportDialog,
  AgentModelTierInfo,
} from "@/features/session/components/session-export-dialog";
import { SvgIcon } from "@/components/ui/svg-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { Button } from "@/components-v2/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/components-v2/ui/carousel";
import { Checkbox } from "@/components-v2/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components-v2/ui/dialog";
import { Label } from "@/components-v2/ui/label";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain/api-connection";
import { SessionProps } from "@/modules/session/domain/session";

const Section = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div"> & {
    title: string;
    subtitle?: string;
    colSpan?: number;
    children?: React.ReactNode;
    className?: string;
    fill?: boolean;
    error?: boolean;
    onboarding?: boolean;
  }
>(
  (
    { title, subtitle, children, className, fill, error, onboarding, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group/section bg-background-surface-3 relative cursor-pointer rounded-[8px]",
          "transition-all duration-200 ease-in-out",
          "border-border-normal hover:border-text-primary hover:ring-text-primary border hover:ring",
          onboarding &&
            "border-border-selected-primary border-1 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
          className,
        )}
        {...props}
      >
        <div className="flex flex-row items-center justify-between p-[16px] pb-0">
          <div className="flex flex-row gap-[16px]">
            <div className="text-text-primary text-[20px] leading-[24px] font-[600] break-words">
              {title}
            </div>
            {subtitle && (
              <div className="text-text-primary text-[20px] leading-[24px] font-[500]">
                {subtitle}
              </div>
            )}
          </div>
          <div
            className={cn(
              "opacity-0 transition-opacity duration-200 ease-in-out group-hover/section:opacity-100",
              onboarding && "opacity-100",
            )}
          >
            <SvgIcon name="edit" size={24} />
          </div>
        </div>
        <div className={cn(!fill && "m-[16px]", className)}>{children}</div>
        {error && (
          <div
            className={cn(
              "pointer-events-none absolute inset-[-1px] rounded-[8px]",
              "inset-ring-status-destructive-light inset-ring-2",
            )}
          />
        )}
      </div>
    );
  },
);
Section.displayName = "Section";

const SectionCarousel = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Carousel>
      <CarouselContent className="mr-4 ml-0">{children}</CarouselContent>
      <CarouselPrevious
        className="bg-background-card border-border-container left-4 border disabled:hidden"
        variant="ghost_white"
      />
      <CarouselNext
        className="bg-background-card border-border-container right-4 border disabled:hidden"
        variant="ghost_white"
      />
    </Carousel>
  );
};

const SessionSettings = ({
  setIsOpenSettings,
  refEditCards,
  refInitCardTab,
  isSettingsOpen,
}: {
  setIsOpenSettings: (open: boolean) => void;
  refEditCards: React.RefObject<HTMLDivElement>;
  refInitCardTab: MutableRefObject<CardTab>;
  isSettingsOpen: boolean;
}) => {
  const { activePage } = useAppStore();
  const { selectedSessionId } = useSessionStore();

  // Session onboarding
  const sessionOnboardingSteps = useAppStore.use.sessionOnboardingSteps();
  const setSessionOnboardingStep = useAppStore.use.setSessionOnboardingStep();
  const shouldShowResourceManagementTooltip =
    !sessionOnboardingSteps.sessionEdit;
  const [showSectionAnimation, setShowSectionAnimation] = useState(false);

  // Detect if there's enough space for the tooltip on the left
  const [hasSpaceForTooltip, setHasSpaceForTooltip] = useState(false);
  useEffect(() => {
    const checkSpace = () => {
      // Check if viewport is wide enough (need at least 1364px for 1024px container + 340px tooltip)
      setHasSpaceForTooltip(window.innerWidth >= 1464);
    };
    checkSpace();
    window.addEventListener("resize", checkSpace);
    return () => window.removeEventListener("resize", checkSpace);
  }, []);

  // Derive tooltip visibility directly from onboarding state (no useState needed!)
  const showResourceTooltip = shouldShowResourceManagementTooltip;

  // Handle completing the session edit onboarding step
  const handleResourceManagementGotIt = useCallback(() => {
    // Complete the onboarding step (this will hide the tooltip automatically)
    setSessionOnboardingStep("sessionEdit", true);

    // Trigger animation on "Got it!" press
    setShowSectionAnimation(true);
    setTimeout(() => {
      setShowSectionAnimation(false);
    }, 1500);
  }, [setSessionOnboardingStep, setIsOpenSettings]);

  const [session, invalidateSession] = useSession(selectedSessionId);
  const { data: flow, isLoading: isLoadingFlow } = useFlow(session?.flowId);

  // Auto-save functionality
  const { autoSave } = useAutoSaveSession({
    session: session ?? null,
    debounceMs: 0,
  });

  // Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Update session with auto-save
  const updateSession = useCallback(
    async (props: Partial<SessionProps>) => {
      await autoSave(props, true); // Skip toast for auto-save
    },
    [autoSave],
  );

  // Export session
  const [isOpenExport, setIsOpenExport] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportSession = useCallback(async () => {
    // Check session is null
    if (!session) {
      return;
    }

    try {
      // Start export
      setIsExporting(true);

      // Export session to file
      const fileOrError = await SessionService.exportSessionToFile.execute({
        sessionId: session.id,
        includeHistory: includeHistory,
      });
      if (fileOrError.isFailure) {
        throw new Error(fileOrError.getError());
      }
      const file = fileOrError.getValue();

      // Download session file
      downloadFile(file);

      // Close dialog
      setIsOpenExport(false);
      setIncludeHistory(false);
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to export session", {
          description: error.message,
        });
      }
    } finally {
      // End export
      setIsExporting(false);
    }
  }, [includeHistory, session]);

  // Title editing handlers
  const handleSaveTitle = useCallback(async () => {
    if (!session || editedTitle === session.title) {
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateSession({
        title: editedTitle,
      });
      setIsEditingTitle(false);
    } catch (error) {
      console.error("Error saving session title:", error);
      toast.error("Failed to save session title");
    }
  }, [session, editedTitle, updateSession]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingTitle(false);
    setEditedTitle("");
  }, []);

  // Validate session settings
  const refEditFlowAndAgents = useRef<HTMLDivElement>(null);
  const { invalids } = useValidationStore();
  const isFlowInvalid = session?.flowId
    ? (invalids.get("flows")?.[session.flowId.toString()] ?? false)
    : false;
  /*
  const validateSessionSettings = useCallback(() => {
    // Check active page is
    if (activePage !== Page.Sessions) {
      return;
    }

    // Check session is null
    if (!session) {
      return;
    }

    // Validate flow
    if (!isLoadingFlow && !flow) {
      showBanner({
        title: "Flow not found",
        description: "Please select a flow.",
        actionLabel: "Go to select",
        onAction: () => {
          setIsOpenSettings(true);
          refEditFlowAndAgents.current?.click();
        },
      });
      return;
    }
  }, [activePage, flow, isLoadingFlow, session, setIsOpenSettings]);
  useEffect(() => {
    validateSessionSettings();
  }, [validateSessionSettings, selectedSessionId]);
  */

  if (!session) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative mx-auto my-[80px] flex w-full max-w-[1024px] min-w-[873px] flex-col rounded-[16px] p-[16px]",
        "bg-background-surface-2",
        shouldShowResourceManagementTooltip &&
          "border-border-selected-primary border-1 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
      )}
    >
      <div className="flex flex-col justify-end gap-[16px] space-y-0">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row items-center gap-[16px] pr-[16px]">
            <div className="text-text-secondary text-[16px] leading-[25.6px] font-[600]">
              Session
            </div>
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className="text-text-primary border-text-primary max-w-[820px] min-w-[200px] border-b bg-transparent text-[16px] leading-[25.6px] font-[400] outline-none"
                  style={{
                    width: `${Math.max(editedTitle.length * 8 + 16, 200)}px`,
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <Check className="text-status-success h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <div className="text-text-primary max-w-[870px] truncate text-[16px] leading-[25.6px] font-[400]">
                  {session.title}
                </div>
                <button
                  onClick={() => {
                    setEditedTitle(session.title || "");
                    setIsEditingTitle(true);
                  }}
                  className="hover:bg-background-surface-4 flex-shrink-0 rounded p-1 transition-colors"
                >
                  <Pencil className="text-text-subtle hover:text-text-primary h-4 w-4 transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>
        <EditCards
          refInitCardTab={refInitCardTab}
          defaultValue={{
            userCharacterCardId: session.userCharacterCardId ?? null,
            aiCharacterCardIds: session.aiCharacterCardIds,
            plotCardId: session.plotCard?.id ?? null,
          }}
          onSave={async (newValue) => {
            await updateSession(newValue);
          }}
          trigger={
            <Section
              ref={refEditCards}
              title="Cards"
              className=""
              error={session?.aiCharacterCardIds.length === 0}
              onboarding={showSectionAnimation}
              fill
            >
              <SectionCarousel>
                {session?.plotCard && (
                  <CardListItem
                    label="Plot"
                    separator
                    cardId={session.plotCard.id}
                  />
                )}
                {session?.userCharacterCardId && (
                  <CardListItem
                    label="User character"
                    separator
                    cardId={session?.userCharacterCardId}
                  />
                )}
                {session?.aiCharacterCardIds.length > 0 ? (
                  session?.aiCharacterCardIds.map(
                    (cardId: UniqueEntityID, index: number) => (
                      <CardListItem
                        key={cardId.toString()}
                        cardId={cardId}
                        {...(index === 0 && { label: "AI character" })}
                      />
                    ),
                  )
                ) : (
                  <EmptyCard
                    label="AI character"
                    description={
                      <>
                        Add at least one AI
                        <br />
                        character to continue
                      </>
                    }
                  />
                )}
              </SectionCarousel>
            </Section>
          }
        />
        <EditFlowAndAgents
          defaultValue={{
            flowId: session.props.flowId?.toString() ?? "",
          }}
          onSave={async (newValue) => {
            await updateSession({
              flowId: newValue.flowId,
            });
          }}
          trigger={
            <Section
              ref={refEditFlowAndAgents}
              title="Flow"
              className="col-span-3"
              subtitle={flow?.props.name}
              error={!flow || isFlowInvalid}
              onboarding={showSectionAnimation}
              fill
            >
              <SectionCarousel>
                {flow ? (
                  flow.agentIds.map((agentId: UniqueEntityID) => (
                    <AgentListItem key={agentId.toString()} agentId={agentId} />
                  ))
                ) : (
                  <EmptyFlow />
                )}
              </SectionCarousel>
            </Section>
          }
        />
        <div className="flex flex-row gap-[16px]">
          <div className="w-[30%]">
            <EditLanguage
              defaultValue={{
                translation: session.translation!,
              }}
              onSave={async (newValue) => {
                await updateSession(newValue);
              }}
              trigger={
                <Section
                  title="Language & Translation"
                  className="h-full"
                  onboarding={showSectionAnimation}
                >
                  <div className="w-full">
                    <div className="flex flex-col gap-[16px]">
                      <div className="flex flex-col gap-[8px]">
                        <div className="text-text-input-subtitle text-[16px] leading-[19px] font-[400]">
                          Displayed language
                        </div>
                        <div className="text-text-primary max-w-[150px] text-[16px] leading-[19px] font-[600]">
                          {languagesLabelMap.get(
                            session?.translation?.displayLanguage ?? "",
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <div className="text-text-input-subtitle text-[16px] leading-[19px] font-[400]">
                          AI understanding language
                        </div>
                        <div className="text-text-primary max-w-[150px] text-[16px] leading-[19px] font-[600]">
                          {languagesLabelMap.get(
                            session?.translation?.promptLanguage ?? "",
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Section>
              }
            />
          </div>
          <div className="w-[30%]">
            <EditBackground
              defaultValue={{
                backgroundId: session?.backgroundId,
              }}
              onSave={async (newValue) => {
                await updateSession(newValue);
              }}
              trigger={
                <Section
                  title="Background"
                  className="h-full"
                  onboarding={showSectionAnimation}
                >
                  <div className="max-w-full">
                    <SelectedBackground backgroundId={session?.backgroundId} />
                  </div>
                </Section>
              }
            />
          </div>
          <div className="w-[40%]">
            <EditChatStyling
              defaultValue={{
                chatStyles: session.chatStyles!,
              }}
              onSave={async (newValue) => {
                await updateSession(newValue);
              }}
              container={session.id.toString()}
              backgroundId={session.backgroundId}
              trigger={
                <Section
                  title="Message styling"
                  className="h-full items-center"
                  onboarding={showSectionAnimation}
                >
                  <ColorTable chatStyles={session?.chatStyles} />
                </Section>
              }
              characterCardId={session.aiCharacterCardIds?.[0]}
              userCharacterCardId={session.userCharacterCardId}
            />
          </div>
        </div>
      </div>

      {/* Resource Management Tooltip */}
      {showResourceTooltip && (
        <div
          className={cn(
            "bg-background-surface-2 border-border-selected-primary absolute z-10 flex flex-col items-end justify-center gap-2 rounded-2xl border-1 px-4 py-3 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
            hasSpaceForTooltip
              ? "top-4 left-[-340px] w-80 max-w-80" // Outside to the left when space available
              : "top-4 right-4 left-4 w-80 max-w-80", // Inside at the top when no space
          )}
        >
          <div className="text-text-primary justify-start self-stretch text-sm leading-tight font-semibold">
            Local resource management
          </div>
          <div className="text-text-primary justify-start self-stretch text-xs font-normal">
            This area manages local resources specific to this session only.
            Session-specific assets & tools.
          </div>
          <div className="inline-flex items-start justify-start gap-2">
            <button
              onClick={handleResourceManagementGotIt}
              className="bg-background-surface-light hover:bg-background-surface-4 inline-flex min-w-20 flex-col items-center justify-center gap-2 rounded-[20px] px-3 py-1.5 transition-colors"
            >
              <div className="text-text-contrast-text justify-center text-xs font-semibold">
                Got it
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { SessionSettings };
