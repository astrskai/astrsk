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
 * - Mobile: Button above grid + 2 columns per row
 * - Desktop: New card inside grid + up to 5 columns per row
 */
export function SessionsGrid({
  sessions,
  onCreateSession,
  keyword,
}: SessionsGridProps) {
  const showNewSessionCard = !keyword;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mobile: Create Button (outside grid) */}
      {showNewSessionCard && (
        <Button
          onClick={onCreateSession}
          icon={<Plus size={16} />}
          className="w-full md:hidden"
        >
          Create new session
        </Button>
      )}

      {/* Sessions Grid */}
      <div className="mx-auto grid w-full grid-cols-2 justify-center gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Desktop: New Session Card (inside grid) */}
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
    </div>
  );
}
