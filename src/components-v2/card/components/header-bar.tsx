"use client";

import { Import, Plus } from "lucide-react";
import React from "react";

import { useAppStore } from "@/app/stores/app-store";
import { TypoBase } from "@/components-v2/typo";
import { Button } from "@/components-v2/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { CardType } from "@/modules/card/domain";

interface HeaderBarProps {
  title: string;
  onCreate?: () => void;
  onImport?: () => void;
  cardType?: CardType;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onCreate,
  onImport,
  cardType = CardType.Character, // Default to Character type if not specified
}) => {
  const handleCreateClick = () => {
    if (onCreate) {
      onCreate();
    }
  };

  const handleImportClick = () => {
    if (onImport) {
      onImport();
    }
  };

  const { isCardImportDonNotShowAgain, setIsCardImportDonNotShowAgain } =
    useAppStore();

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="space-x-2">
        {!isCardImportDonNotShowAgain ? (
          <Button size="lg" variant="outline" onClick={handleImportClick}>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    <Import className="mr-1" />
                    Import
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="flex flex-col px-4 py-3">
                    <TypoBase className="pb-3">
                      V2, V3 character cards compatible
                    </TypoBase>
                    {/* <TypoBase className="pb-3">
                      Import your old cards, no problem
                    </TypoBase>
                    <TypoSmall>
                      Already created cards on another platform?
                    </TypoSmall>
                    <TypoSmall className="pb-3">
                      No worries — V2 and V3 cards are fully compatible here.
                    </TypoSmall> */}
                    <div className="flex flex-row justify-end">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCardImportDonNotShowAgain(true);
                        }}
                      >
                        Don&apos;t show this again
                      </Button>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Button>
        ) : (
          <Button size="lg" variant="outline" onClick={handleImportClick}>
            <span className="flex items-center">
              <Import className="mr-1" />
              Import
            </span>
          </Button>
        )}
        <Button size="lg" onClick={handleCreateClick}>
          <Plus className="mr-1" />
          Create
        </Button>
      </div>
    </div>
  );
};

export default HeaderBar;
