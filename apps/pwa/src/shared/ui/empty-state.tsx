import { Button } from "@/shared/ui/button";

interface EmptyStateProps {
  /**
   * Main title displayed when no data exists
   */
  title: string;
  /**
   * Optional description text below the title
   */
  description?: string;
  /**
   * Label for the action button
   */
  buttonLabel: string;
  /**
   * Click handler for the action button
   */
  onButtonClick: () => void;
}

/**
 * Empty state component for data lists
 * Displays a message with a call-to-action button when no data is available
 * Used across characters, scenarios, workflows, and sessions
 */
export function EmptyState({
  title,
  description,
  buttonLabel,
  onButtonClick,
}: EmptyStateProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <div className="max-w-[400px] text-center">
        <h2 className="text-text-primary mb-3 text-2xl font-semibold md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="text-text-secondary text-base">{description}</p>
        )}
      </div>
      <Button onClick={onButtonClick} size="lg">
        {buttonLabel}
      </Button>
    </div>
  );
}
