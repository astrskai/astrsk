import {
  Settings,
  ChevronRight,
  Download,
  Globe,
  Image,
  Check,
  X,
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

import { downloadFile } from "@/shared/lib";

import { useSession } from "@/app/hooks/use-session";
import { SessionService } from "@/app/services/session-service";
import { useSessionStore } from "@/app/stores/session-store";
import { sessionQueries } from "@/app/queries/session-queries";
import { useQueryClient } from "@tanstack/react-query";

import {
  Button,
  CheckboxMobile,
  Label,
  SvgIcon,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { SessionProps } from "@/entities/session/domain/session";

// Import mobile edit components
import { EditCardsMobile } from "@/features/session/mobile/edit-session/edit-cards-mobile";
import { EditFlowAndAgentsMobile } from "@/features/session/mobile/edit-session/edit-flow-and-agents-mobile";
import { EditLanguageMobile } from "@/features/session/mobile/edit-session/edit-language-mobile";
import { EditBackgroundMobile } from "@/features/session/mobile/edit-session/edit-background-mobile";
import { EditChatStylingMobile } from "@/features/session/mobile/edit-session/edit-chat-styling-mobile";

type SettingsSection =
  | "main"
  | "cards"
  | "flows"
  | "language"
  | "background"
  | "styling";

interface SessionSettingsMobileProps {
  isOpen: boolean;
  onClose: () => void;
  initialCardTab?: "character" | "user" | "plot";
  onCardTabChange?: (tab: "character" | "user" | "plot") => void;
}

export function SessionSettingsMobile({
  isOpen,
  onClose,
  initialCardTab,
  onCardTabChange,
}: SessionSettingsMobileProps) {
  const [currentSection, setCurrentSection] = useState<SettingsSection>("main");
  const { selectedSessionId } = useSessionStore();
  const [session, invalidateSession] = useSession(selectedSessionId);
  const queryClient = useQueryClient();

  // Update session function - same pattern as desktop
  const updateSession = useCallback(
    async (props: Partial<SessionProps>) => {
      // Check session is null
      if (!session) {
        return;
      }

      // Update session
      const updateResult = session.update(props);
      if (updateResult.isFailure) {
        toast.error("Failed to update session", {
          description: updateResult.getError(),
        });
        return;
      }

      // Save session
      const saveResult = await SessionService.saveSession.execute({
        session: session,
      });
      if (saveResult.isFailure) {
        toast.error("Failed to save session", {
          description: saveResult.getError(),
        });
        return;
      }

      // Invalidate session and wait for it to complete
      await invalidateSession();

      // Also invalidate the sessionQueries.detail query key
      await queryClient.invalidateQueries({
        queryKey: sessionQueries.detail(selectedSessionId ?? undefined)
          .queryKey,
      });
    },
    [invalidateSession, session, queryClient, selectedSessionId],
  );

  // Inline edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Auto-navigate to cards when initialCardTab is set (for plot card selection)
  useEffect(() => {
    if (isOpen && initialCardTab === "plot") {
      setCurrentSection("cards");
    }
  }, [isOpen, initialCardTab]);

  // Export session state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize title value when session changes
  useEffect(() => {
    if (session && titleValue !== session.props.title && !isEditingTitle) {
      setTitleValue(session.props.title);
    }
  }, [session?.props.title, isEditingTitle]);

  if (!session) return null;

  const handleStartEditTitle = () => {
    setIsEditingTitle(true);
    setTitleValue(session.props.title);
    // Focus the input after a short delay to ensure it's mounted
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 100);
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue === session.props.title) {
      setIsEditingTitle(false);
      setTitleValue(session.props.title);
      return;
    }

    try {
      setIsSavingTitle(true);
      await updateSession({ title: titleValue.trim() });
      setIsEditingTitle(false);
      toast.success("Session name updated");
    } catch (error) {
      setTitleValue(session.props.title);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setTitleValue(session.props.title);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleExportSession = async () => {
    if (!session) return;

    try {
      setIsExporting(true);
      const exportOrError = await SessionService.exportSessionToFile.execute({
        sessionId: session.id,
        includeHistory: includeHistory,
      });

      if (exportOrError.isFailure) {
        throw new Error(exportOrError.getError());
      }

      const file = exportOrError.getValue();
      await downloadFile(file);
      setIsExportDialogOpen(false);
      toast.success("Session exported successfully");
    } catch (error) {
      toast.error("Failed to export session", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSectionChange = (section: SettingsSection) => {
    setCurrentSection(section);
  };

  const handleBack = () => {
    if (currentSection === "main") {
      onClose();
    } else {
      setCurrentSection("main");
    }
  };

  const MenuItem = ({
    icon,
    title,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className="hover:bg-background-card-hover flex h-[36px] w-full items-center justify-between px-[12px] transition-colors"
    >
      <div className="flex items-center gap-[8px]">
        <div className="text-text-body flex h-6 w-6 items-end justify-center">
          {icon}
        </div>
        <span className="text-text-body text-base">{title}</span>
      </div>
      {/* <ChevronRight className="w-5 h-5 text-text-secondary" /> */}
    </button>
  );

  return (
    <>
      {/* Container - now using full height and width from Sheet */}
      <div className="bg-background-surface-2 flex h-full flex-col">
        {/* Header */}
        <div className="items-left border-border-dark flex h-[102px] flex-col gap-[8px] border-b px-[14px] py-[16px]">
          <div className="flex h-[46px] items-center gap-[8px]">
            <Settings className="min-h-6 min-w-6" />
            <h2 className="truncate text-lg font-medium">
              {currentSection === "main"
                ? "Session settings"
                : currentSection === "cards"
                  ? "Cards"
                  : currentSection === "flows"
                    ? "Flow & Agent"
                    : currentSection === "language"
                      ? "Language & Translation"
                      : currentSection === "background"
                        ? "Background"
                        : currentSection === "styling"
                          ? "Message styling"
                          : ""}
            </h2>
          </div>
          <div className="">
            {isEditingTitle ? (
              <div className="-m-2 flex items-center gap-2 rounded-lg p-2">
                <input
                  ref={titleInputRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-text-body flex-1 truncate border-0 bg-transparent text-left text-sm leading-normal font-medium focus:ring-0 focus:outline-none"
                  disabled={isSavingTitle}
                />
                <Button
                  size="icon"
                  variant="ghost_white"
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle || !titleValue.trim()}
                  className="h-5 w-5 p-0"
                >
                  <Check className="text-text-body min-h-4 min-w-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={handleStartEditTitle}
                className="hover:bg-background-card-hover -m-2 flex w-full items-center gap-2 rounded-lg p-2 transition-colors"
              >
                <h3 className="text-text-body truncate text-left text-sm font-medium">
                  {session.props.title}
                </h3>
                <div className="text-text-body flex-shrink-0">
                  <SvgIcon name="edit" size={20} />
                </div>
              </button>
            )}
          </div>
        </div>
        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden px-[12px] py-[12px] pb-[48px]">
          {currentSection === "main" && (
            <>
              {/* Settings sections */}
              <div className="flex flex-1 flex-col gap-[16px] overflow-y-auto">
                <MenuItem
                  icon={<SvgIcon name="cards" size={24} />}
                  title="Cards"
                  onClick={() => handleSectionChange("cards")}
                />
                <MenuItem
                  icon={<SvgIcon name="agents" size={24} />}
                  title="Flows"
                  onClick={() => handleSectionChange("flows")}
                />
                <MenuItem
                  icon={<Globe className="min-h-6 min-w-6" />}
                  title="Language & Translation"
                  onClick={() => handleSectionChange("language")}
                />
                <MenuItem
                  icon={<Image className="min-h-6 min-w-6" />}
                  title="Background"
                  onClick={() => handleSectionChange("background")}
                />
                <MenuItem
                  icon={<SvgIcon name="message_style" size={24} />}
                  title="Message styling"
                  onClick={() => handleSectionChange("styling")}
                />
              </div>

              {/* Export section - Fixed at bottom */}
              <div className="">
                <MenuItem
                  icon={
                    <SvgIcon
                      name="export"
                      size={24}
                      className="fill-text-muted-title"
                    />
                  }
                  title="Export session"
                  onClick={() => setIsExportDialogOpen(true)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Full-page edit components */}
      {currentSection === "cards" && (
        <EditCardsMobile
          session={session}
          onSave={async (newValue) => {
            await updateSession(newValue);
          }}
          onBack={() => {
            setCurrentSection("main");
            // Reset card tab when going back
            onCardTabChange?.("character");
          }}
          initialTab={initialCardTab}
        />
      )}

      {currentSection === "flows" && (
        <EditFlowAndAgentsMobile
          session={session}
          onSave={async (newValue) => {
            await updateSession(newValue);
          }}
          onBack={() => setCurrentSection("main")}
        />
      )}

      {currentSection === "language" && (
        <EditLanguageMobile
          session={session}
          onSave={async (newValue) => {
            await updateSession(newValue);
          }}
          onBack={() => setCurrentSection("main")}
        />
      )}

      {currentSection === "background" && (
        <EditBackgroundMobile
          session={session}
          onSave={async (newValue) => {
            await updateSession(newValue);
          }}
          onBack={() => setCurrentSection("main")}
        />
      )}

      {currentSection === "styling" && (
        <EditChatStylingMobile
          session={session}
          onSave={async (newValue) => {
            await updateSession(newValue);
          }}
          onBack={() => setCurrentSection("main")}
        />
      )}

      {/* Export dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export session</DialogTitle>
            <DialogDescription>
              Download your session as a file that can be imported later.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label className="flex items-center gap-2">
              <CheckboxMobile
                checked={includeHistory}
                onCheckedChange={(checked) =>
                  setIncludeHistory(checked === true)
                }
              />
              <span>Include chat history</span>
            </Label>
          </div>

          <DialogFooter>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleExportSession}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
