import { memo } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components-v2/ui/button";

// Memoized Create button used across all lists
export const CreateButton = memo(({ onClick }: { onClick: () => void }) => (
  <Button
    variant="secondary"
    size="sm"
    className="w-full"
    onClick={onClick}
  >
    <Plus />
    Create
  </Button>
));
CreateButton.displayName = "CreateButton";

// Memoized Import button used across all lists
export const ImportButton = memo(({ onClick }: { onClick: () => void }) => (
  <Button
    variant="secondary"
    size="sm"
    className="w-full"
    onClick={onClick}
  >
    <Download />
    Import
  </Button>
));
ImportButton.displayName = "ImportButton";

// Re-export SearchInput which is already memoized
export { SearchInput } from "@/components-v2/search-input";