import { Plus } from "lucide-react";
import { Session } from "@/entities/session/domain/session";
import { SessionCard } from "./session-card";
import { NewSessionCard } from "./new-session-card";
import { Button } from "@/shared/ui/forms";

interface SessionsGridProps {
  sessions: Session[];
  onCreateSession: () => void;
  keyword: string;
}

/**
 * Sessions grid component
 * Displays sessions in a responsive grid with optional New Session Card
 *
 * Layout:
 * - Mobile: Create button (when no search) + session cards
 * - Desktop: New Session Card (when no search) + session cards
 */
export function SessionsGrid({
  sessions,
  onCreateSession,
  keyword,
}: SessionsGridProps) {
  const showNewSessionCard = !keyword;

  return (
    <div className="mx-auto grid [grid-template-columns:repeat(auto-fit,minmax(min(288px,100%),340px))] justify-center gap-4 p-4">
      {/* Mobile: Create Button */}
      {showNewSessionCard && (
        <Button
          onClick={onCreateSession}
          icon={<Plus size={16} />}
          className="w-full md:hidden"
        >
          Create new session
        </Button>
      )}

      {/* Desktop: New Session Card */}
      {showNewSessionCard && (
        <NewSessionCard
          onClick={onCreateSession}
          className="hidden md:flex"
        />
      )}

      {/* Existing Sessions */}
      {sessions.map((session) => (
        <SessionCard key={session.id.toString()} session={session} />
      ))}
    </div>
  );
}
