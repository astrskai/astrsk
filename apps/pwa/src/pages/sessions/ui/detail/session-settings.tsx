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

import { downloadFile, logger } from "@/shared/lib";
import { languagesLabelMap } from "@/shared/lib/translate-utils";
import { UniqueEntityID } from "@/shared/domain";

import { useFlow } from "@/shared/hooks/use-flow";
import { useSession } from "@/shared/hooks/use-session";
import { useAutoSaveSession } from "@/shared/hooks/use-auto-save-session";
import { SessionService } from "@/app/services/session-service";
import { useAppStore } from "@/shared/stores/app-store";
import { useSessionStore } from "@/shared/stores/session-store";
import { useValidationStore } from "@/shared/stores/validation-store";
import { cn } from "@/shared/lib";
import { CardTab } from "@/features/session/create-session/step-cards";
import {
  EditBackground,
  SelectedBackground,
} from "./edit/edit-background";
import {
  CardListItem,
  EditCards,
  EmptyCard,
} from "./edit/edit-cards";
import {
  ColorTable,
  EditChatStyling,
} from "./edit/edit-chat-styling";
import {
  AgentListItem,
  EditFlowAndAgents,
  EmptyFlow,
} from "./edit/edit-flow-and-agents";
import { EditLanguage } from "./edit/edit-language";

import {
  SvgIcon,
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui";

import { SessionProps } from "@/entities/session/domain/session";

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
        <div className={cn(
          "flex flex-row items-center justify-between pb-0",
          "p-[16px]",
          "max-md:p-[12px]",
        )}>
          <div className="flex flex-row gap-[16px]">
            <div className={cn(
              "text-text-primary font-[600] break-words",
              "text-[20px] leading-[24px]",
              "max-md:text-[18px] max-md:leading-[22px]",
            )}>
              {title}
            </div>
            {subtitle && (
              <div className={cn(
                "text-text-primary font-[500]",
                "text-[20px] leading-[24px]",
                "max-md:text-[18px] max-md:leading-[22px]",
              )}>
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
        <div className={cn(
          !fill && "m-[16px]",
          !fill && "max-md:m-[12px]",
          className
        )}>{children}</div>
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
      <CarouselContent className={cn(
        "mr-4 ml-0",
        "max-md:mr-2 max-md:ml-0",
      )}>{children}</CarouselContent>
      <CarouselPrevious
        className={cn(
          "bg-background-card border-border-container border disabled:hidden",
          "left-4",
          "max-md:left-2 max-md:h-8 max-md:w-8",
        )}
        variant="ghost_white"
      />
      <CarouselNext
        className={cn(
          "bg-background-card border-border-container border disabled:hidden",
          "right-4",
          "max-md:right-2 max-md:h-8 max-md:w-8",
        )}
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
        "relative mx-auto flex w-full flex-col rounded-[16px] bg-background-surface-2",
        // Desktop: margin, max-width, padding
        "my-[80px] max-w-[1024px] p-[16px]",
        // Mobile: no margin, full width, smaller padding
        "max-md:my-0 max-md:rounded-none max-md:p-[12px]",
        shouldShowResourceManagementTooltip &&
          "border-border-selected-primary border-1 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
      )}
    >
      <div className={cn(
        "flex flex-col justify-end space-y-0",
        "gap-[16px]",
        "max-md:gap-[12px]",
      )}>
        <div className={cn(
          "flex justify-between",
          // Desktop: horizontal
          "flex-row",
          // Mobile: vertical
          "max-md:flex-col max-md:items-start max-md:gap-[8px]",
        )}>
          <div className={cn(
            "flex items-center",
            // Desktop: horizontal
            "flex-row gap-[16px] pr-[16px]",
            // Mobile: vertical, full width
            "max-md:flex-col max-md:items-start max-md:gap-[8px] max-md:pr-0 max-md:w-full",
          )}>
            <div className={cn(
              "text-text-secondary font-[600]",
              "text-[16px] leading-[25.6px]",
              "max-md:text-[14px] max-md:leading-[20px]",
            )}>
              Session
            </div>
            {isEditingTitle ? (
              <div className={cn(
                "flex items-center",
                // Desktop: horizontal
                "flex-row gap-[8px]",
                // Mobile: vertical, full width
                "max-md:flex-col max-md:items-stretch max-md:gap-[8px] max-md:w-full",
              )}>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  className={cn(
                    "text-text-primary border-text-primary border-b bg-transparent font-[400] outline-none",
                    // Desktop: larger size
                    "text-[16px] leading-[25.6px] max-w-[820px] min-w-[200px]",
                    // Mobile: smaller size and full width
                    "max-md:text-[14px] max-md:leading-[20px] max-md:max-w-full max-md:min-w-0 max-md:w-full",
                  )}
                  autoFocus
                />
                <div className={cn(
                  "flex flex-row gap-[8px]",
                  "max-md:justify-end",
                )}>
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
                </div>
              </div>
            ) : (
              <div className={cn(
                "flex items-center",
                // Desktop: horizontal
                "flex-row gap-[8px]",
                // Mobile: horizontal but with full width title
                "max-md:w-full max-md:gap-[8px]",
              )}>
                <div className={cn(
                  "text-text-primary truncate font-[400]",
                  // Desktop: max-w
                  "max-w-[870px] text-[16px] leading-[25.6px]",
                  // Mobile: smaller text, full width
                  "max-md:flex-1 max-md:text-[14px] max-md:leading-[20px]",
                )}>
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
              </div>
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
        <div className={cn(
          "flex gap-[16px]",
          // Desktop: horizontal
          "flex-row",
          // Mobile: vertical stack
          "max-md:flex-col max-md:gap-[12px]",
        )}>
          <div className={cn(
            "w-[30%]",
            "max-md:w-full",
          )}>
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
          <div className={cn(
            "w-[30%]",
            "max-md:w-full",
          )}>
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
          <div className={cn(
            "w-[40%]",
            "max-md:w-full",
          )}>
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
            // Desktop: left side if space, inside top if no space
            hasSpaceForTooltip
              ? "top-4 left-[-340px] w-80 max-w-80"
              : "top-4 right-4 left-4 w-80 max-w-80",
            // Mobile: always inside at top with margins
            "max-md:top-2 max-md:right-2 max-md:left-2 max-md:w-auto max-md:max-w-none",
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
