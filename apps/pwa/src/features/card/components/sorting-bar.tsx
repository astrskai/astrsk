import { ArrowUpAZ } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components-v2/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components-v2/ui/dropdown-menu";
import { SearchCardsSort } from "@/modules/card/repos";

interface SortingBarProps {
  sortOrder: SearchCardsSort;
  onSort: (sortOrder: SearchCardsSort) => void;
  onFilter?: () => void;
}

const SortingBar: React.FC<SortingBarProps> = ({
  sortOrder,
  onSort,
  onFilter,
}) => {
  // Helper function to get display text for sort order
  const getSortDisplayText = (sort: SearchCardsSort): string => {
    switch (sort) {
      case SearchCardsSort.Latest:
        return "Newest First";
      case SearchCardsSort.Oldest:
        return "Oldest First";
      case SearchCardsSort.TitleAtoZ:
        return "Title (A-Z)";
      case SearchCardsSort.TitleZtoA:
        return "Title (Z-A)";
      default:
        return "Sort";
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="rounded-[8px]">
            <ArrowUpAZ className="w-4 h-4 mr-1" />
            {getSortDisplayText(sortOrder)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onSort(SearchCardsSort.Latest)}>
            Newest First
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort(SearchCardsSort.Oldest)}>
            Oldest First
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort(SearchCardsSort.TitleAtoZ)}>
            Title (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSort(SearchCardsSort.TitleZtoA)}>
            Title (Z-A)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortingBar;
