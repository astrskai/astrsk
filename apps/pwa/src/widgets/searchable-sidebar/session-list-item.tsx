import { useNavigate } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { Session } from "@/entities/session/domain/session";
import { useSessionValidation } from "@/shared/hooks/use-session-validation";
import { cn } from "@/shared/lib";

interface SessionListItemProps {
  session: Session;
  isActive: boolean;
}

/**
 * Simple session list item for sidebar
 * Shows session name, message count, and validation status
 */
export function SessionListItem({ session, isActive }: SessionListItemProps) {
  const navigate = useNavigate();
  const { isValid, isFetched } = useSessionValidation(session.id);
  const isInvalid = isFetched && !isValid;

  const messageCount = session.props.turnIds.length || 0;

  const handleClick = () => {
    navigate({
      to: "/sessions/$sessionId",
      params: { sessionId: session.id.toString() },
    });
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col gap-2 border-b border-gray-900 p-4 text-left text-gray-50 transition-colors hover:bg-gray-800/80",
        isActive && "bg-gray-800",
      )}
    >
      {/* Session Name */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="truncate text-sm font-semibold">
          {session.props.title || "Untitled Session"}
        </h4>
        {isInvalid && (
          <CircleAlert className="text-status-destructive-light h-4 w-4 shrink-0" />
        )}
      </div>

      {/* Message Count */}
      <div className="flex items-center gap-1 text-xs text-gray-200">
        <span>
          {messageCount > 0 ? (
            <>
              <span className="text-sm font-semibold text-gray-50">
                {messageCount}
              </span>{" "}
              Messages
            </>
          ) : (
            "New session"
          )}
        </span>
      </div>
    </button>
  );
}
