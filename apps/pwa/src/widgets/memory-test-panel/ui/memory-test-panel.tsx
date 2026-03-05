import { MemoryTestControl } from "./memory-test-control";
import { MemoryTestResults } from "./memory-test-results";

interface MemoryTestPanelProps {
  sessionId: string;
}

export function MemoryTestPanel({ sessionId }: MemoryTestPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <MemoryTestControl sessionId={sessionId} />
      <MemoryTestResults />
    </div>
  );
}
