import { Check, Users, Clapperboard, ArrowRight } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib";
import { Button } from "@/shared/ui/forms/button";
import { DialogBase } from "@/shared/ui/dialogs/base";

/**
 * Session mode types
 * - roleplay: User controls an existing character (Cast Member)
 * - director: User observes and guides the narrative (Director)
 */
export type SessionMode = "roleplay" | "director";

interface ModeOption {
  id: SessionMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  feedbackIcon: React.ReactNode;
  feedbackText: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "roleplay",
    title: "Cast Member",
    description:
      "Inhabit the mind of an existing character. Direct their actions and speak their lines.",
    icon: <Users size={28} />,
    feedbackIcon: <Users className="mr-2 h-4 w-4" />,
    feedbackText: "You will proceed to character selection.",
  },
  {
    id: "director",
    title: "The Director",
    description:
      "Observe and control. You are not in the scene; you guide the narrative.",
    icon: <Clapperboard size={28} />,
    feedbackIcon: <Clapperboard className="mr-2 h-4 w-4" />,
    feedbackText: "You will have full control over the AI's narrative output.",
  },
];

interface ModeSelectionCardProps {
  mode: ModeOption;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * ModeSelectionCard - A selectable card component for mode selection
 */
function ModeSelectionCard({
  mode,
  isSelected,
  onClick,
}: ModeSelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // Base styles
        "group relative flex w-full cursor-pointer flex-col items-center rounded-xl p-3 transition-all duration-300",
        "md:w-1/2 md:p-6",
        // Selection states
        isSelected
          ? "border-2 border-brand-500 bg-brand-500/10 shadow-lg hover:border-brand-400"
          : "border border-border-subtle bg-surface opacity-80 hover:border-border-default hover:bg-hover hover:opacity-100",
      )}
    >
        {/* Glow overlay effect */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent opacity-0 transition-opacity duration-500",
            isSelected ? "opacity-100" : "group-hover:opacity-50",
          )}
        />

        {/* Icon */}
        <div
          className={cn(
            "mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised transition-all duration-300 group-hover:rotate-6 md:mb-4 md:h-14 md:w-14",
            isSelected ? "text-brand-400" : "text-fg-muted group-hover:text-fg-default",
          )}
        >
          {mode.icon}
        </div>

        {/* Title */}
        <h3
          className={cn(
            "mb-2 text-base font-semibold transition-colors",
            isSelected ? "text-brand-400" : "text-fg-muted group-hover:text-fg-default",
          )}
        >
          {mode.title}
        </h3>

        {/* Description - hidden on mobile */}
        <p className="hidden px-2 text-center text-xs leading-relaxed text-fg-subtle md:block">
          {mode.description}
        </p>

        {/* Selection Indicator - Check mark like combobox */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <Check className="h-5 w-5 text-brand-400" />
          </div>
        )}
    </button>
  );
}

interface ModeSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeSelected: (mode: SessionMode) => void;
}

export function ModeSelectionDialog({
  open,
  onOpenChange,
  onModeSelected,
}: ModeSelectionDialogProps) {
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);

  const selectedModeOption = MODE_OPTIONS.find((m) => m.id === selectedMode);
  const canProceed = selectedMode !== null;

  const handleProceed = () => {
    if (selectedMode) {
      onModeSelected(selectedMode);
      // Don't call onOpenChange here - parent handles closing after mode is set
    }
  };

  return (
    <DialogBase
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      isShowCloseButton={true}
      title={
        <span className="text-2xl font-extrabold tracking-tight text-fg-default md:text-3xl">
          Define Your{" "}
          <span className="from-brand-400 to-brand-600 bg-gradient-to-r bg-clip-text text-transparent">
            Role
          </span>
        </span>
      }
      description="How will you influence the chronicles today?"
      content={
        <div className="flex flex-col gap-8 pt-2">
          {/* Mode Selection Cards */}
          <div className="flex flex-col gap-2 p-2 md:flex-row md:gap-4">
            {MODE_OPTIONS.map((mode) => (
              <ModeSelectionCard
                key={mode.id}
                mode={mode}
                isSelected={selectedMode === mode.id}
                onClick={() => setSelectedMode(mode.id)}
              />
            ))}
          </div>

          {/* Dynamic Feedback */}
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 ease-in-out",
              selectedMode ? "max-h-24 opacity-100" : "max-h-0 opacity-0",
            )}
          >
            {selectedModeOption && (
              <div className="flex items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 p-4 text-brand-400">
                {selectedModeOption.feedbackIcon}
                <span className="text-sm">{selectedModeOption.feedbackText}</span>
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="flex justify-center">
          {canProceed ? (
            <Button
              onClick={handleProceed}
              size="md"
              className="w-full rounded-lg md:w-auto"
            >
              Enter Session
              <ArrowRight size={16} />
            </Button>
          ) : (
            <span className="text-sm text-fg-muted">Choose a Mode</span>
          )}
        </div>
      }
    />
  );
}
