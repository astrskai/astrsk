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
import { CardTab } from "@/components-v2/session/create-session/step-cards";
import {
  EditBackground,
  SelectedBackground,
} from "@/components-v2/session/edit-session/edit-background";
import {
  CardListItem,
  EditCards,
  EmptyCard,
} from "@/components-v2/session/edit-session/edit-cards";
import {
  ColorTable,
  EditChatStyling,
} from "@/components-v2/session/edit-session/edit-chat-styling";
import {
  AgentListItem,
  EditFlowAndAgents,
  EmptyFlow,
} from "@/components-v2/session/edit-session/edit-flow-and-agents";
import { EditLanguage } from "@/components-v2/session/edit-session/edit-language";
import { SessionExportDialog, AgentModelTierInfo } from "@/components-v2/session/components/session-export-dialog";
import { SvgIcon } from "@/components-v2/svg-icon";
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
>(({ title, subtitle, children, className, fill, error, onboarding, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group/section relative bg-background-surface-3 rounded-[8px] cursor-pointer",
        "transition-all duration-200 ease-in-out",
        "border border-border-normal hover:border-text-primary hover:ring hover:ring-text-primary",
        onboarding && "shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)] border-1 border-border-selected-primary",
        className,
      )}
      {...props}
    >
      <div className="p-[16px] pb-0 flex flex-row justify-between items-center">
        <div className="flex flex-row gap-[16px]">
          <div className="font-[600] text-[20px] leading-[24px] text-text-primary break-words">
            {title}
          </div>
          {subtitle && (
            <div className="font-[500] text-[20px] leading-[24px] text-text-primary">
              {subtitle}
            </div>
          )}
        </div>
        <div className={cn(
          "transition-opacity duration-200 ease-in-out opacity-0 group-hover/section:opacity-100",
          onboarding && "opacity-100"
        )}>
          <SvgIcon name="edit" size={24} />
        </div>
      </div>
      <div className={cn(!fill && "m-[16px]", className)}>{children}</div>
      {error && (
        <div
          className={cn(
            "absolute inset-[-1px] rounded-[8px] pointer-events-none",
            "inset-ring-2 inset-ring-status-destructive-light",
          )}
        />
      )}
    </div>
  );
});
Section.displayName = "Section";

const SectionCarousel = ({ children }: { children?: React.ReactNode }) => {
  return (
    <Carousel>
      <CarouselContent className="ml-0 mr-4">{children}</CarouselContent>
      <CarouselPrevious
        className="disabled:hidden left-4 bg-background-card border border-border-container"
        variant="ghost_white"
      />
      <CarouselNext
        className="disabled:hidden right-4 bg-background-card border border-border-container"
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
  const shouldShowResourceManagementTooltip = !sessionOnboardingSteps.sessionEdit;
  const [showSectionAnimation, setShowSectionAnimation] = useState(false);
  
  // Detect if there's enough space for the tooltip on the left
  const [hasSpaceForTooltip, setHasSpaceForTooltip] = useState(false);
  useEffect(() => {
    const checkSpace = () => {
      // Check if viewport is wide enough (need at least 1364px for 1024px container + 340px tooltip)
      setHasSpaceForTooltip(window.innerWidth >= 1464);
    };
    checkSpace();
    window.addEventListener('resize', checkSpace);
    return () => window.removeEventListener('resize', checkSpace);
  }, []);
  
  // Derive tooltip visibility directly from onboarding state (no useState needed!)
  const showResourceTooltip = shouldShowResourceManagementTooltip;

  // Handle completing the session edit onboarding step
  const handleResourceManagementGotIt = useCallback(() => {
    // Complete the onboarding step (this will hide the tooltip automatically)
    setSessionOnboardingStep('sessionEdit', true);
    
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
        "w-full min-w-[873px] max-w-[1024px] mx-auto my-[80px] p-[16px] rounded-[16px] flex flex-col relative",
        "bg-background-surface-2",
        shouldShowResourceManagementTooltip && "shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)] border-1 border-border-selected-primary",
      )}
    >
      <div className="flex flex-col space-y-0 gap-[16px] justify-end">
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-[16px] pr-[16px] items-center">
            <div className="font-[600] text-[16px] leading-[25.6px] text-text-secondary">
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
                  className="font-[400] text-[16px] leading-[25.6px] text-text-primary bg-transparent border-b border-text-primary outline-none min-w-[200px] max-w-[820px]"
                  style={{
                    width: `${Math.max(editedTitle.length * 8 + 16, 200)}px`,
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
                >
                  <Check className="w-4 h-4 text-status-success" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="font-[400] text-[16px] leading-[25.6px] text-text-primary max-w-[870px] truncate">
                  {session.title}
                </div>
                <button
                  onClick={() => {
                    setEditedTitle(session.title || "");
                    setIsEditingTitle(true);
                  }}
                  className="p-1 hover:bg-background-surface-4 rounded transition-colors flex-shrink-0"
                >
                  <Pencil className="w-4 h-4 text-text-subtle hover:text-text-primary transition-colors" />
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
                  session?.aiCharacterCardIds.map((cardId: UniqueEntityID, index: number) => (
                    <CardListItem
                      key={cardId.toString()}
                      cardId={cardId}
                      {...(index === 0 && { label: "AI character" })}
                    />
                  ))
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
                <Section title="Language & Translation" className="h-full" onboarding={showSectionAnimation}>
                  <div className="w-full">
                    <div className="flex flex-col gap-[16px]">
                      <div className="flex flex-col gap-[8px]">
                        <div className="font-[400] text-[16px] leading-[19px] text-text-input-subtitle">
                          Displayed language
                        </div>
                        <div className="max-w-[150px] font-[600] text-[16px] leading-[19px] text-text-primary">
                          {languagesLabelMap.get(
                            session?.translation?.displayLanguage ?? "",
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <div className="font-[400] text-[16px] leading-[19px] text-text-input-subtitle">
                          AI understanding language
                        </div>
                        <div className="max-w-[150px] font-[600] text-[16px] leading-[19px] text-text-primary">
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
                <Section title="Background" className="h-full" onboarding={showSectionAnimation}>
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
                  className="items-center h-full"
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
            "absolute px-4 py-3 bg-background-surface-2 rounded-2xl shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)] border-1 border-border-selected-primary flex flex-col justify-center items-end gap-2 z-10",
            hasSpaceForTooltip 
              ? "top-4 left-[-340px] w-80 max-w-80"  // Outside to the left when space available
              : "top-4 left-4 w-80 max-w-80 right-4"  // Inside at the top when no space
          )}
        >
          <div className="self-stretch justify-start text-text-primary text-sm font-semibold leading-tight">
            Local resource management
          </div>
          <div className="self-stretch justify-start text-text-primary text-xs font-normal">
            This area manages local resources specific to this session only. Session-specific assets & tools.
          </div>
          <div className="inline-flex justify-start items-start gap-2">
            <button
              onClick={handleResourceManagementGotIt}
              className="min-w-20 px-3 py-1.5 bg-background-surface-light rounded-[20px] inline-flex flex-col justify-center items-center gap-2 hover:bg-background-surface-4 transition-colors"
            >
              <div className="justify-center text-text-contrast-text text-xs font-semibold">
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
