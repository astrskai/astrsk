// TODO: apply color palette

import { useAsset } from "@/app/hooks/use-asset";
import { cardQueries } from "@/app/queries/card-queries";
import { queryClient } from "@/app/queries/query-client";
import { CardService } from "@/app/services";
import { SessionService } from "@/app/services/session-service";
import { Page, useAppStore } from "@/app/stores/app-store";
import useCardImport from "@/components-v2/card/hooks/useCardImport";
import { SECTION_HEADER_HEIGHT } from "@/components-v2/left-navigation/constants";
import { SectionHeader } from "@/components-v2/left-navigation/left-navigation";
import { SearchInput, CreateButton, ImportButton } from "@/components-v2/left-navigation/shared-list-components";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { DeleteConfirm } from "@/components-v2/confirm";
import { CardImportDialog } from "@/components-v2/card/components/card-import-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components-v2/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components-v2/ui/dropdown-menu";
import { FloatingLabelInput } from "@/components-v2/ui/floating-label-input";
import { Label } from "@/components-v2/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components-v2/ui/radio-group";
import { TableName } from "@/db/schema/table-name";
import { CharacterCard, PlotCard } from "@/modules/card/domain";
import { Card, CardType } from "@/modules/card/domain/card";
import { Session } from "@/modules/session/domain/session";
import { UniqueEntityID } from "@/shared/domain";
import { cn, downloadFile, logger } from "@/shared/utils";
import * as amplitude from "@amplitude/analytics-browser";
import { useQuery } from "@tanstack/react-query";
import { delay } from "lodash-es";
import {
  Copy,
  Download,
  Plus,
  Settings2,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const CardItem = ({
  cardId,
  disableHover = false,
  selected,
}: {
  cardId: UniqueEntityID;
  disableHover?: boolean;
  selected?: boolean;
}) => {
  // Fetch card data
  const { data: card } = useQuery(cardQueries.detail<Card>(cardId));
  const [icon] = useAsset(card?.props.iconAssetId);

  // Handle select
  const setSelectedCardId = useAppStore.use.setSelectedCardId();
  const setActivePage = useAppStore.use.setActivePage();
  const handleSelect = useCallback(() => {
    setSelectedCardId(cardId.toString());
    setActivePage(Page.CardPanel);
  }, [cardId, setActivePage, setSelectedCardId]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      // Export card as file
      const fileOrError = await CardService.exportCardToFile.execute({
        cardId: cardId,
        options: { format: "png" },
      });
      if (fileOrError.isFailure) {
        throw new Error(fileOrError.getError());
      }
      const file = fileOrError.getValue();

      // Download file
      downloadFile(file);
    } catch (error) {
      logger.error("Failed to export card", error);
      if (error instanceof Error) {
        toast.error("Failed to export card", {
          description: error.message,
        });
      }
    }
  }, [cardId]);

  // Handle copy
  const handleCopy = useCallback(async () => {
    try {
      // Clone card
      const clonedCardOrError = await CardService.cloneCard.execute({
        cardId: cardId,
      });
      if (clonedCardOrError.isFailure) {
        throw new Error(clonedCardOrError.getError());
      }
      const clonedCard = clonedCardOrError.getValue();

      // Select cloned card
      setSelectedCardId(clonedCard.id.toString());
      setActivePage(Page.CardPanel);

      // Invalidate card queries
      queryClient.invalidateQueries({
        queryKey: cardQueries.lists(),
      });
    } catch (error) {
      logger.error("Failed to copy card", error);
      if (error instanceof Error) {
        toast.error("Failed to copy card", {
          description: error.message,
        });
      }
    }
  }, [cardId, setActivePage, setSelectedCardId]);

  // Handle delete
  const selectedCardId = useAppStore.use.selectedCardId();
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);
  const getUsedSessions = useCallback(async () => {
    const sessionsOrError = await SessionService.listSessionByCard.execute({
      cardId: cardId,
    });
    if (sessionsOrError.isFailure) {
      return;
    }
    setUsedSessions(sessionsOrError.getValue());
  }, [cardId]);
  const handleDelete = useCallback(async () => {
    try {
      // Check card
      if (!card) {
        return;
      }

      // Track event
      amplitude.track("delete_card", {
        card_type: card.props.type,
        card_token_count: card.props.tokenCount,
      });

      // Delete card
      const deleteResult = await CardService.deleteCard.execute(card.id);
      if (deleteResult.isFailure) {
        throw new Error(deleteResult.getError());
      }

      // Unselect deleted card
      if (selectedCardId === cardId.toString()) {
        setSelectedCardId(null);
        setActivePage(Page.Init);
      }

      // Invalidate card queries
      queryClient.invalidateQueries({
        queryKey: cardQueries.lists(),
      });

      // Invalidate used sessions validation and detail queries
      for (const usedSession of usedSessions) {
        // Invalidate validation queries
        queryClient.invalidateQueries({
          queryKey: [
            TableName.Sessions,
            usedSession.id.toString(),
            "validation",
          ],
        });
        // Also invalidate the session detail query so it reloads and detects missing card
        queryClient.invalidateQueries({
          queryKey: [
            TableName.Sessions,
            "detail",
            usedSession.id.toString(),
          ],
        });
      }
    } catch (error) {
      logger.error("Failed to delete card", error);
      if (error instanceof Error) {
        toast.error("Failed to delete card", {
          description: error.message,
        });
      }
    } finally {
      setIsOpenDelete(false);
    }
  }, [
    card,
    cardId,
    selectedCardId,
    setActivePage,
    setSelectedCardId,
    usedSessions,
  ]);

  return (
    <>
      {/* Card Item */}
      <div
        className={cn(
          "pl-8 pr-4 py-2 group/item h-12 border-b-1 border-b-[#313131]",
          "bg-[#272727]",
          !disableHover && "hover:bg-[#313131] pointer-coarse:focus-within:bg-[#313131]",
          "flex flex-row gap-1 items-center relative",
          selected && "bg-background-surface-4 rounded-[8px]",
        )}
        tabIndex={!disableHover ? 0 : undefined}
        onClick={!disableHover ? handleSelect : undefined}
      >
        {/* Card Info */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden pointer-events-none",
            !disableHover && "group-hover/item:hidden pointer-coarse:group-focus-within/item:hidden",
          )}
        >
          <img
            src={
              icon ??
              (card?.props.type === CardType.Character
                ? "/img/placeholder/character-card-image.png"
                : "/img/placeholder/plot-card-image.png")
            }
            alt="Card icon"
            className={cn(
              "absolute w-[160px] right-0 translate-x-[30px] translate-y-[-40px]",
              !icon &&
                card?.props.type === CardType.Character &&
                "w-[90px] translate-x-[0px] translate-y-[-30px]",
            )}
          />
          <div
            className={cn(
              "absolute inset-0 left-[188px] right-[40px] bg-linear-to-r from-[#272727FF] to-[#27272700]",
              selected && "from-[#414141FF]",
              !icon &&
                card?.props.type === CardType.Character &&
                "left-[218px]",
            )}
          />
        </div>
        <div
          className={cn(
            "z-0 size-[20px] mr-1 shrink-0 rounded-full grid place-items-center",
            card?.props.type === CardType.Character && "bg-[#B59EFF]",
            card?.props.type === CardType.Plot && "bg-[#98D7F9]",
          )}
        >
          {card?.props.type === CardType.Character && (
            <SvgIcon name="character_icon" size={12} />
          )}
          {card?.props.type === CardType.Plot && (
            <SvgIcon name="plot_icon" size={12} />
          )}
        </div>
        <div className="z-0 grow line-clamp-1 break-all font-[600] text-[12px] leading-[15px] text-[#F1F1F1]">
          {card?.props.title}
        </div>

        {/* Actions */}
        {!disableHover && (
          <TooltipProvider>
            <div className="z-0 hidden group-hover/item:flex pointer-coarse:group-focus-within/item:flex shrink-0 text-[#9D9D9D] flex-row gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleExport();
                    }}
                  >
                    <Upload size={20} />
                    <span className="sr-only">Export</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={14} variant="button">
                  <p>Export</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopy();
                    }}
                  >
                    <Copy size={20} />
                    <span className="sr-only">Copy</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={14} variant="button">
                  <p>Copy</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isOpenDelete) {
                        await getUsedSessions();
                      }
                      setIsOpenDelete(true);
                    }}
                  >
                    <Trash2 size={20} />
                    <span className="sr-only">Delete</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={14} variant="button">
                  <p>Delete</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>

      {/* Place dialog outside of item to prevent selecting */}
      <DeleteConfirm
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        description={
          <>
            This card is used in{" "}
            <span className="text-secondary-normal">
              {usedSessions.length} sessions
            </span>
            .
            <br />
            Deleting it might corrupt or disable these sessions.
          </>
        }
        onDelete={handleDelete}
      />
    </>
  );
};

const CardFilter = ({
  type,
  setType,
}: {
  type: CardType | null;
  setType: (type: CardType | null) => void;
}) => {
  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <button className="size-[24px] grid place-items-center relative">
                <Settings2 size={24} className="text-text-subtle" />
                <span className="sr-only">Filter</span>
                <div
                  className={cn(
                    "absolute top-0 right-[-2px] size-[6px] rounded-full",
                    type === CardType.Character && "bg-status-required",
                    type === CardType.Plot && "bg-status-optional",
                  )}
                />
              </button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent side="bottom" variant="button">
            <p>Card filters</p>
          </TooltipContent>
        </Tooltip>
      <DropdownMenuContent
        side="bottom"
        align="end"
        className="bg-background-surface-1 rounded-[8px] p-[4px]"
      >
        <DropdownMenuItem
          onClick={() => setType(null)}
          className={cn(
            "justify-center rounded-[6px] text-text-subtle font-[400] text-[12px] leading-[15px]",
            "focus:bg-background-surface-3 focus:text-text-primary focus:font-[600]",
          )}
        >
          All
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setType(CardType.Character)}
          className={cn(
            "justify-center rounded-[6px] text-text-subtle font-[400] text-[12px] leading-[15px]",
            "focus:bg-background-surface-3 focus:text-secondary-normal focus:font-[600]",
          )}
        >
          Character
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setType(CardType.Plot)}
          className={cn(
            "justify-center rounded-[6px] text-text-subtle font-[400] text-[12px] leading-[15px]",
            "focus:bg-background-surface-3 focus:text-button-background-primary focus:font-[600]",
          )}
        >
          Plot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </TooltipProvider>
  );
};

const CardSection = ({ onClick }: { onClick?: () => void }) => {
  // Handle expand
  const [expanded, setExpanded] = useState(true);

  // Fetch cards
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<CardType | null>(null);
  const { data: cards } = useQuery(
    cardQueries.list({
      keyword,
      type: type ? [type] : undefined,
    }),
  );

  // Selected card
  const activePage = useAppStore.use.activePage();
  const selectedCardId = useAppStore.use.selectedCardId();

  // Handle create
  const setSelectedCardId = useAppStore.use.setSelectedCardId();
  const setActivePage = useAppStore.use.setActivePage();
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [createCardType, setCreateCardType] = useState<CardType>(
    CardType.Character,
  );
  const [createCardName, setCreateCardName] = useState("New card");
  const handleCreate = useCallback(async () => {
    try {
      // Create card
      const cardOrError =
        createCardType === CardType.Character
          ? CharacterCard.create({
              title: createCardName,
              name: createCardName,
            })
          : PlotCard.create({
              title: createCardName,
            });
      if (cardOrError.isFailure) {
        throw new Error(cardOrError.getError());
      }
      const card = cardOrError.getValue();

      // Save card
      const savedCardOrError = await CardService.saveCard.execute(card);
      if (savedCardOrError.isFailure) {
        throw new Error(savedCardOrError.getError());
      }
      const savedCard = savedCardOrError.getValue();

      // Invalidate card queries
      queryClient.invalidateQueries({
        queryKey: cardQueries.lists(),
      });

      // Select created card
      setSelectedCardId(savedCard.id.toString());
      setActivePage(Page.CardPanel);
    } catch (error) {
      logger.error("Failed to create card", error);
      if (error instanceof Error) {
        toast.error("Failed to create card", {
          description: error.message,
        });
      }
    } finally {
      setIsOpenCreate(false);
      setCreateCardType(CardType.Character);
      setCreateCardName("New card");
    }
  }, [createCardName, createCardType, setActivePage, setSelectedCardId]);

  // Handle import
  const handleInvalidation = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: cardQueries.lists(),
    });
  }, []);
  const {
    isOpenImportCardPopup,
    setIsOpenImportCardPopup,
    onImportCardFromFile,
  } = useCardImport(handleInvalidation);

  return (
    <>
      <SectionHeader
        name="Cards"
        icon={<SvgIcon name="cards" size={20} />}
        top={SECTION_HEADER_HEIGHT}
        bottom={SECTION_HEADER_HEIGHT}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
        onClick={() => {
          setExpanded(true);
          delay(() => {
            onClick?.();
          }, 50);
        }}
      />
      <div className={cn(!expanded && "hidden")}>
        <div className="pl-8 pr-4 py-2 flex flex-row gap-2 items-center w-[320px]">
          <SearchInput
            className="grow"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
            }}
          />
          <CardFilter type={type} setType={setType} />
        </div>
        <div className="pl-8 pr-4 py-2 flex flex-row gap-2 items-center">
          <CreateButton onClick={() => setIsOpenCreate(true)} />
          <Dialog
            open={isOpenCreate}
            onOpenChange={(open) => setIsOpenCreate(open)}
          >
            <DialogContent hideClose>
              <DialogHeader>
                <DialogTitle>Create Card</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                <div className="font-[400] text-[16px] leading-[25.6px] text-[#9D9D9D]">
                  Card type :{" "}
                  <span className="capitalize">{createCardType}</span>
                </div>
                <RadioGroup
                  value={createCardType}
                  onValueChange={(value) => {
                    setCreateCardType(value as CardType);
                  }}
                >
                  <div className="flex flex-row items-center gap-2">
                    <RadioGroupItem
                      value={CardType.Character}
                      id="radio-char"
                    />
                    <Label htmlFor="radio-char">Character card</Label>
                  </div>
                  <div className="flex flex-row items-center gap-2">
                    <RadioGroupItem value={CardType.Plot} id="radio-plot" />
                    <Label htmlFor="radio-plot">Plot card</Label>
                  </div>
                </RadioGroup>
              </div>
              <FloatingLabelInput
                label="Card name"
                value={createCardName}
                onChange={(e) => {
                  setCreateCardName(e.target.value);
                }}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => {
                      setIsOpenCreate(false);
                      setCreateCardType(CardType.Character);
                      setCreateCardName("New card");
                    }}
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" onClick={handleCreate} size="lg">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ImportButton onClick={() => setIsOpenImportCardPopup(true)} />
          <CardImportDialog
            open={isOpenImportCardPopup}
            onOpenChange={setIsOpenImportCardPopup}
            onImportFile={onImportCardFromFile}
          />
        </div>
        {cards && cards.length > 0 ? (
          cards.map((card: Card) => (
            <CardItem
              key={card.id.toString()}
              cardId={card.id}
              selected={
                activePage === Page.CardPanel &&
                card.id.toString() === selectedCardId
              }
            />
          ))
        ) : (
          <div className="pl-8 pr-4 py-2 border-b-1 border-b-[#313131] grid place-items-center">
            <div className="font-[400] text-[12px] leading-[15px] text-[#9D9D9D]">
              No cards
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export { CardSection, CardItem };
