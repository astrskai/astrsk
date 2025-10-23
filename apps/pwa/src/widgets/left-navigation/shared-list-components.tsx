import { memo, forwardRef } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/shared/ui";

// Memoized Create button used across all lists
export const CreateButton = memo(
  forwardRef<HTMLButtonElement, { onClick: () => void }>(({ onClick }, ref) => (
    <Button
      ref={ref}
      variant="secondary"
      size="sm"
      className="w-full"
      onClick={onClick}
    >
      <Plus />
      Create
    </Button>
  )),
);
CreateButton.displayName = "CreateButton";

// Memoized Import button used across all lists
export const ImportButton = memo(
  forwardRef<HTMLButtonElement, { onClick: () => void }>(({ onClick }, ref) => (
    <Button
      ref={ref}
      variant="secondary"
      size="sm"
      className="w-full"
      onClick={onClick}
    >
      <Download />
      Import
    </Button>
  )),
);
ImportButton.displayName = "ImportButton";

// Re-export SearchInput which is already memoized
export { SearchInput } from "@/shared/ui";
