import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardType } from "@/entities/card/domain";
import { UniqueEntityID } from "@/shared/domain";
import { useQuery } from "@tanstack/react-query";
import { cardQueries } from "@/entities/card/api";
import {
  DockviewReact,
  IDockviewPanelProps,
  DockviewReadyEvent,
  DockviewApi,
} from "dockview";
import type { IDockviewPanel, DockviewGroupPanel } from "dockview-core";
import { queryClient } from "@/shared/api/query-client";
import {
  useCardUIStore,
  CardPanelVisibility,
} from "@/entities/card/stores/card-ui-store";
import { CardPanelProvider } from "@/features/card/panels/card-panel-provider";
import { invalidateSingleCardQueries } from "@/features/card/utils/invalidate-card-queries";
import { extractCardPanelType } from "@/features/card/utils/panel-id-utils";
import "@/app/styles/dockview-detail.css";

// Import panel components
import { CardPanel } from "@/pages/assets/characters/panel";
import { MetadataPanel } from "@/pages/assets/characters/panel/metadata-panel";
import { LorebookPanel } from "@/pages/assets/characters/panel/lorebook-panel";
import { CharacterInfoPanel } from "@/pages/assets/characters/panel/character-info-panel";
import { PlotInfoPanel } from "@/pages/assets/characters/panel/plot-info-panel";
import { VariablesPanel } from "@/pages/assets/characters/panel/variables-panel";
import { FirstMessagesPanel } from "@/pages/assets/characters/panel/scenarios-panel";
import { ImageGeneratorPanel } from "@/pages/assets/characters/panel/image-generator-panel";
import { CardVibePanel } from "@/pages/assets/characters/panel/vibe-panel";
import { SvgIcon } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { logger } from "@/shared/lib";
import CustomDockviewTab from "@/widgets/dockview-default-tab";
import { PanelFocusAnimationWrapper } from "@/widgets/dockview-panel-focus-animation";
import { useNavigate } from "@tanstack/react-router";

interface CharacterPlotDetailPageProps {
  cardId: string;
}

// Panel wrapper component that preserves state and handles invalidation
const PanelWrapper: React.FC<{
  children: React.ReactNode;
  cardId: string;
  panelType: string;
  preserveState?: boolean;
}> = ({ children, cardId, preserveState = true }) => {
  // Only invalidate other panels on unmount, not the current panel
  useEffect(() => {
    return () => {
      if (!preserveState) {
        // Invalidate queries for this specific panel type
        invalidateSingleCardQueries(queryClient, new UniqueEntityID(cardId));
      }
    };
  }, [cardId, preserveState]);

  return <>{children}</>;
};

// Main Card Panel Component (kept separate - no PanelWrapper)
const CardPanelComponent: React.FC<IDockviewPanelProps> = ({ params }) => {
  const { cardId } = params;
  return <CardPanel cardId={cardId} />;
};

// Panel component factory for sub-panels (with PanelWrapper and focus animation)
const createCardPanelComponent = (
  panelType: string,
  Component: React.FC<{ cardId: string }>,
): React.FC<IDockviewPanelProps> => {
  return (props) => {
    const { cardId } = props.params;
    return (
      <PanelFocusAnimationWrapper
        api={props.api}
        containerApi={props.containerApi}
      >
        <PanelWrapper cardId={cardId} panelType={panelType}>
          <Component cardId={cardId} />
        </PanelWrapper>
      </PanelFocusAnimationWrapper>
    );
  };
};

// Panel component registry
const CARD_PANEL_COMPONENTS = {
  "card-panel": CardPanelComponent,
  metadata: createCardPanelComponent("metadata", MetadataPanel),
  "character-info": createCardPanelComponent(
    "character-info",
    CharacterInfoPanel,
  ),
  "plot-info": createCardPanelComponent("plot-info", PlotInfoPanel),
  lorebooks: createCardPanelComponent("lorebooks", LorebookPanel),
  variables: createCardPanelComponent("variables", VariablesPanel),
  scenarios: createCardPanelComponent("scenarios", FirstMessagesPanel),
  imageGenerator: createCardPanelComponent(
    "imageGenerator",
    ImageGeneratorPanel,
  ),
  vibe: createCardPanelComponent("vibe", CardVibePanel),
};

// Constants
const CARD_PANEL_ID = "card-panel-main";
const MIN_GROUP_WIDTH = 384;

// Custom hook for card loading
const useCardLoader = (cardId: string) => {
  // Use React Query to fetch card data
  const {
    data: card,
    isLoading,
    error,
  } = useQuery({
    ...cardQueries.detail(cardId),
    enabled: !!cardId,
  });

  return {
    card: card || null,
    isLoading,
    error: error ? `Failed to load card: ${error}` : null,
  };
};

// Custom hook for panel visibility management
const usePanelVisibility = (card: Card | null) => {
  const getCardTypePanelVisibility =
    useCardUIStore.use.getCardTypePanelVisibility();
  const setCardTypePanelVisibilityStore =
    useCardUIStore.use.setCardTypePanelVisibility();
  const defaultPanelVisibility = useCardUIStore.use.defaultPanelVisibility();
  const [panelVisibility, setPanelVisibilityState] =
    useState<CardPanelVisibility>(defaultPanelVisibility);

  const cardType = useMemo(() => {
    return card?.props.type === CardType.Character ? "character" : "plot";
  }, [card]);

  useEffect(() => {
    if (card) {
      const newPanelVisibility = getCardTypePanelVisibility(cardType);
      setPanelVisibilityState(newPanelVisibility);
    }
  }, [card, cardType, getCardTypePanelVisibility]);

  const setPanelVisibility = useCallback(
    (panel: keyof CardPanelVisibility, visible: boolean) => {
      setPanelVisibilityState((prev) => ({
        ...prev,
        [panel]: visible,
      }));

      if (card) {
        setCardTypePanelVisibilityStore(cardType, panel, visible);
      }
    },
    [card, cardType, setCardTypePanelVisibilityStore],
  );

  return { panelVisibility, setPanelVisibility, cardType };
};

export default function CharacterPlotDetailPage({
  cardId,
}: CharacterPlotDetailPageProps) {
  const navigate = useNavigate();
  const [api, setApi] = useState<DockviewApi | null>(null);
  const setSelectedCardId = useCardUIStore.use.setSelectedCardId();

  // Use custom hooks
  const { card, isLoading, error } = useCardLoader(cardId);
  const { panelVisibility, setPanelVisibility, cardType } =
    usePanelVisibility(card);

  // Set selected card ID when cardId changes
  useEffect(() => {
    setSelectedCardId(cardId);
  }, [cardId, setSelectedCardId]);

  // Check card exists
  useEffect(() => {
    if (!isLoading && !card) {
      logger.error("Card not found");
      navigate({ to: "/", replace: true });
    }
  }, [card, isLoading, navigate]);

  // Layout management
  const getCardTypeLayout = useCardUIStore.use.getCardTypeLayout();
  const setCardTypeLayout = useCardUIStore.use.setCardTypeLayout();
  const defaultPanelVisibility = useCardUIStore.use.defaultPanelVisibility();

  // Handle dockview ready event
  const handleReady = useCallback(
    (event: DockviewReadyEvent) => {
      const dockviewApi = event.api;
      setApi(dockviewApi);

      // Check if card panel already exists
      const existingCardPanel = dockviewApi.getPanel(CARD_PANEL_ID);
      if (existingCardPanel) {
        return;
      }

      // Always create the main card panel first
      const cardPanel = dockviewApi.addPanel({
        id: CARD_PANEL_ID,
        component: "card-panel",
        tabComponent: "colored",
        title: "Card",
        params: { cardId },
      });

      // Make the card panel non-closeable
      if (cardPanel) {
        // Get the panel's group
        const group = cardPanel.group;
        if (group) {
          // Lock this group completely - prevent any new panels from being added
          group.model.locked = true;
        }
      }

      // Restore saved layout or use defaults
      if (card) {
        const savedLayout = getCardTypeLayout(cardType);
        if (savedLayout) {
          try {
            // Validate the saved layout has the required structure
            if (!savedLayout.grid || !savedLayout.panels) {
              console.warn(
                "Invalid saved layout structure, skipping restoration",
              );
              return;
            }

            // Check if the saved layout contains the card panel
            const hasCardPanel =
              savedLayout.panels[CARD_PANEL_ID] ||
              (Array.isArray(savedLayout.panels) &&
                savedLayout.panels.some((p: any) => p.id === CARD_PANEL_ID));

            if (!hasCardPanel) {
              console.warn(
                "Saved layout missing card panel, adding it before restoration",
              );
              // Modify the saved layout to include the card panel
              if (
                typeof savedLayout.panels === "object" &&
                !Array.isArray(savedLayout.panels)
              ) {
                savedLayout.panels[CARD_PANEL_ID] = {
                  id: CARD_PANEL_ID,
                  component: "card-panel",
                  title: "Card",
                  params: { cardId },
                };
              }
            }

            // Restore the saved layout directly
            dockviewApi.fromJSON(savedLayout);

            // Ensure card-panel-main exists after restoration
            const restoredCardPanel = dockviewApi.getPanel(CARD_PANEL_ID);
            if (!restoredCardPanel) {
              // Card panel was not in the saved layout, recreate it
              const newCardPanel = dockviewApi.addPanel({
                id: CARD_PANEL_ID,
                component: "card-panel",
                tabComponent: "colored",
                title: "Card",
                params: { cardId },
              });

              if (newCardPanel) {
                // Lock the group
                const group = newCardPanel.group;
                if (group) {
                  group.model.locked = true;
                }
              }
            } else {
              // Ensure the restored card panel's group is locked
              const group = restoredCardPanel.group;
              if (group) {
                group.model.locked = true;
              }
            }

            // Update visibility state based on restored panels
            const restoredPanels = Object.values(dockviewApi.panels);
            const newVisibility = { ...defaultPanelVisibility };

            restoredPanels.forEach((panel: IDockviewPanel) => {
              // Extract the panel type using utility function
              const panelType = extractCardPanelType(panel.id);

              // Map panel types to visibility keys
              if (panelType === "plot-info" || panelType === "character-info") {
                newVisibility.content = true;
              } else if (panelType in newVisibility) {
                newVisibility[panelType as keyof CardPanelVisibility] = true;
              }
            });

            // Already handled by usePanelVisibility hook
          } catch (error) {
            console.warn(
              "Failed to restore layout, ensuring card panel exists:",
              error,
            );

            // Restoration failed, ensure we at least have the card panel
            const fallbackCardPanel = dockviewApi.getPanel(CARD_PANEL_ID);
            if (!fallbackCardPanel) {
              // Try to create the card panel as a fallback
              try {
                const newCardPanel = dockviewApi.addPanel({
                  id: CARD_PANEL_ID,
                  component: "card-panel",
                  tabComponent: "colored",
                  title: "Card",
                  params: { cardId },
                });

                if (newCardPanel) {
                  const group = newCardPanel.group;
                  if (group) {
                    group.model.locked = true;
                  }
                }
              } catch (fallbackError) {
                console.error(
                  "Failed to create fallback card panel:",
                  fallbackError,
                );
              }
            }
          }
        }
      }
    },
    [card, cardId, cardType, getCardTypeLayout, defaultPanelVisibility],
  );

  // Save layout when it changes
  const handleLayoutChange = useCallback(() => {
    if (!api) return;

    try {
      const layout = api.toJSON();
      // Use the current card type from state
      const currentCardType =
        card?.props.type === CardType.Character ? "character" : "plot";
      setCardTypeLayout(currentCardType, layout);
    } catch (error) {
      console.error("Failed to save layout:", error);
    }
  }, [api, card, setCardTypeLayout]);

  // Setup layout change listener
  useEffect(() => {
    if (!api) return;

    const disposable = api.onDidLayoutChange(() => {
      handleLayoutChange();
    });

    return () => {
      disposable.dispose();
    };
  }, [api, handleLayoutChange]);

  // Set minimum width for all groups
  useEffect(() => {
    if (!api) return;

    const setGroupConstraints = () => {
      api.groups.forEach((group: DockviewGroupPanel) => {
        if (group.api && typeof group.api.setConstraints === "function") {
          group.api.setConstraints({
            minimumWidth: MIN_GROUP_WIDTH,
          });
        }
      });
    };

    // Set constraints for existing groups
    setGroupConstraints();

    // Listen for new groups being added
    const disposable = api.onDidAddGroup(() => setGroupConstraints());

    return () => disposable.dispose();
  }, [api]);

  // Sync panel visibility with actual open panels
  useEffect(() => {
    if (!api) return;

    const syncPanelVisibility = () => {
      const openPanels = Object.values(api.panels);
      const newVisibility = { ...defaultPanelVisibility };

      openPanels.forEach((panel: IDockviewPanel) => {
        if (panel.id === CARD_PANEL_ID) return; // Skip the main card panel

        // Extract the panel type using utility function
        const panelType = extractCardPanelType(panel.id);

        // Map panel types to visibility keys
        if (panelType === "plot-info" || panelType === "character-info") {
          newVisibility.content = true;
        } else if (panelType in newVisibility) {
          newVisibility[panelType as keyof CardPanelVisibility] = true;
        }
      });

      // Update the visibility state
      Object.entries(newVisibility).forEach(([key, value]) => {
        if (panelVisibility[key as keyof CardPanelVisibility] !== value) {
          setPanelVisibility(key as keyof CardPanelVisibility, value);
        }
      });
    };

    // Initial sync
    syncPanelVisibility();

    // Listen for panel additions and removals
    const disposables = [
      api.onDidAddPanel(() => syncPanelVisibility()),
      api.onDidRemovePanel(() => syncPanelVisibility()),
    ];

    return () => disposables.forEach((d) => d.dispose());
  }, [api, defaultPanelVisibility, panelVisibility, setPanelVisibility]);

  // Update panel params when cardId changes
  useEffect(() => {
    if (!api || !cardId) return;

    // Update params for all panels with the new cardId
    Object.values(api.panels).forEach((panel: IDockviewPanel) => {
      panel.api.updateParameters({ cardId });
    });
  }, [api, cardId]);

  // Invalidate queries for external components when panel updates
  const invalidateExternalQueries = useCallback(async () => {
    if (card) {
      await invalidateSingleCardQueries(queryClient, card.id);
    }
  }, [card]);

  // Render loading or error states
  if (isLoading || error || !card) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[120]",
          "bg-screen/50 backdrop-blur-sm",
          "transition-opacity duration-200",
          "flex items-center justify-center",
        )}
      >
        <div className="flex flex-col items-center justify-center gap-8 px-4">
          <div
            className="animate-spin-slow"
            style={{
              width: "120px",
              height: "120px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SvgIcon name="astrsk_symbol" size={120} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <CardPanelProvider
      cardId={cardId}
      api={api}
      panelVisibility={panelVisibility}
      setPanelVisibility={setPanelVisibility}
      invalidateExternalQueries={invalidateExternalQueries}
      card={card}
    >
      <div
        className="h-full w-full"
        style={{ height: "calc(100% - var(--topbar-height))" }}
      >
        <DockviewReact
          components={CARD_PANEL_COMPONENTS}
          tabComponents={{ colored: CustomDockviewTab }}
          onReady={(event) => {
            // Fix for tab overflow causing parent container scroll
            event.api.onDidLayoutChange(() => {
              const container = document.querySelector(
                ".dv-dockview",
              ) as HTMLElement;
              if (container) {
                setTimeout(() => {
                  let parent = container.parentElement;
                  while (parent && parent !== document.body) {
                    if (parent.scrollTop > 0) {
                      parent.scrollTop = 0;
                    }
                    parent = parent.parentElement;
                  }
                }, 0);
              }
            });

            handleReady(event);
          }}
          className="dockview-theme-abyss"
          disableFloatingGroups
          defaultRenderer="always"
          hideBorders={false}
        />
      </div>
    </CardPanelProvider>
  );
}
