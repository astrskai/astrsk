import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createSelectors } from "@/shared/lib/zustand-utils";
import { LocalPersistStorage } from "@/shared/stores/local-persist-storage";
import { CardType } from "@/entities/card/domain";

export interface CardPanelVisibility {
  "card-panel": boolean;
  metadata: boolean;
  content: boolean;
  lorebooks: boolean;
  variables: boolean;
  scenarios: boolean;
  imageGenerator: boolean;
  vibe: boolean;
}

interface LayoutState {
  layout: any;
  timestamp: number;
}

interface CardUIState {
  // Card selection and editing state (moved from app-store for FSD compliance)
  cardEditOpen: CardType | null;
  setCardEditOpen: (cardType: CardType | null) => void;
  selectedCardId: string | null;
  setSelectedCardId: (cardId: string | null) => void;

  // Panel visibility states for different card types (character, plot)
  cardTypePanelVisibility: Record<string, CardPanelVisibility>;

  // Complete dockview layouts for different card types (single layout for backward compatibility)
  cardTypeLayouts: Record<string, any>;

  // Multiple layout states for each card type (new feature)
  cardTypeLayoutStates: Record<string, LayoutState[]>;

  // Maximum number of layout states to keep
  maxLayoutStates: number;

  // Get panel visibility for a specific card type
  getCardTypePanelVisibility: (cardType: string) => CardPanelVisibility;

  // Set panel visibility for a specific card type
  setCardTypePanelVisibility: (
    cardType: string,
    panel: keyof CardPanelVisibility,
    visible: boolean,
  ) => void;

  // Get layout for a specific card type (backward compatibility)
  getCardTypeLayout: (cardType: string) => any | null;

  // Set layout for a specific card type (backward compatibility)
  setCardTypeLayout: (cardType: string, layout: any) => void;

  // Get all layout states for a specific card type
  getCardTypeLayoutStates: (cardType: string) => LayoutState[];

  // Add a new layout state
  addCardTypeLayoutState: (cardType: string, layout: any) => void;

  // Get valid layout from states (finds most common valid layout)
  getValidLayoutFromStates: (
    cardType: string,
    currentCardId: string,
  ) => any | null;

  // Reset panel visibility for a specific card type
  resetCardTypePanelVisibility: (cardType: string) => void;

  // Default panel visibility
  defaultPanelVisibility: CardPanelVisibility;
}

const defaultPanelVisibility: CardPanelVisibility = {
  "card-panel": true,
  metadata: false,
  content: false,
  lorebooks: false,
  variables: false,
  scenarios: false,
  imageGenerator: false,
  vibe: false,
};

// Helper function to validate layout
const isValidLayout = (layout: any): boolean => {
  try {
    // Check basic structure
    if (!layout || typeof layout !== "object") {
      return false;
    }

    if (!layout.grid) {
      return false;
    }

    if (!layout.panels) {
      return false;
    }

    // Handle both array and object formats for panels
    let panelCount = 0;
    if (Array.isArray(layout.panels)) {
      panelCount = layout.panels.length;
    } else if (typeof layout.panels === "object") {
      // Panels might be an object/map with panel IDs as keys
      panelCount = Object.keys(layout.panels).length;
    } else {
      return false;
    }

    if (panelCount === 0) {
      return false;
    }

    // Check that grid has required properties
    if (!layout.grid.root || typeof layout.grid.root !== "object") {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to update panel IDs in layout
const updateLayoutPanelIds = (layout: any, currentCardId: string): any => {
  if (!layout || !currentCardId) return layout;

  try {
    const updatedLayout = JSON.parse(JSON.stringify(layout));

    // Update panel IDs - handle both array and object formats
    if (updatedLayout.panels) {
      if (Array.isArray(updatedLayout.panels)) {
        // Handle array format
        updatedLayout.panels.forEach((panel: any) => {
          // Extract panel type from old ID (e.g., "card-info-123" -> "card-info")
          const parts = panel.id.split("-");
          const lastPart = parts[parts.length - 1];

          // Check if last part looks like an ID (alphanumeric)
          if (lastPart && /^[a-zA-Z0-9]+$/.test(lastPart)) {
            const panelType = parts.slice(0, -1).join("-");
            panel.id = `${panelType}-${currentCardId}`;
          }
        });
      } else if (typeof updatedLayout.panels === "object") {
        // Handle object/map format
        const newPanels: any = {};
        Object.entries(updatedLayout.panels).forEach(
          ([key, panel]: [string, any]) => {
            // Skip special case for main panel
            if (key === "card-panel-main") {
              newPanels[key] = panel;
              return;
            }

            // Extract panel type from key
            const parts = key.split("-");
            const lastPart = parts[parts.length - 1];

            // Check if last part looks like an ID (alphanumeric)
            if (lastPart && /^[a-zA-Z0-9]+$/.test(lastPart)) {
              const panelType = parts.slice(0, -1).join("-");
              const newKey = `${panelType}-${currentCardId}`;
              // Make sure panel object has all required properties
              if (panel && typeof panel === "object") {
                newPanels[newKey] = {
                  ...panel,
                  id: newKey,
                  // Ensure these critical properties exist
                  component: panel.component || panelType,
                  title: panel.title || panelType,
                };
              } else {
                // If panel is not an object, create a minimal panel object
                newPanels[newKey] = {
                  id: newKey,
                  component: panelType,
                  title: panelType,
                };
              }
            } else {
              newPanels[key] = panel;
            }
          },
        );
        updatedLayout.panels = newPanels;
      }
    }

    // Also update grid references to panel IDs
    if (updatedLayout.grid && updatedLayout.grid.root) {
      const updateGridViews = (node: any) => {
        if (node.type === "leaf" && node.data && node.data.views) {
          node.data.views = node.data.views.map((viewId: string) => {
            if (viewId === "card-panel-main") return viewId;

            const parts = viewId.split("-");
            const lastPart = parts[parts.length - 1];
            if (lastPart && /^[a-zA-Z0-9]+$/.test(lastPart)) {
              const panelType = parts.slice(0, -1).join("-");
              const newViewId = `${panelType}-${currentCardId}`;
              return newViewId;
            }
            return viewId;
          });
        } else if (node.type === "branch" && node.data) {
          node.data.forEach((child: any) => updateGridViews(child));
        }
      };
      updateGridViews(updatedLayout.grid.root);
    }

    return updatedLayout;
  } catch (error) {
    console.error("Failed to update layout panel IDs:", error);
    return layout;
  }
};

const useCardUIStoreBase = create<CardUIState>()(
  persist(
    immer((set, get) => {
      return {
        // Card selection and editing state
        cardEditOpen: null,
        setCardEditOpen: (cardType) =>
          set((state) => {
            state.cardEditOpen = cardType;
          }),
        selectedCardId: null,
        setSelectedCardId: (cardId) =>
          set((state) => {
            state.selectedCardId = cardId;
          }),

        cardTypePanelVisibility: {},
        cardTypeLayouts: {},
        cardTypeLayoutStates: {},
        maxLayoutStates: 4,

        defaultPanelVisibility,

        getCardTypePanelVisibility: (cardType) => {
          const state = get();
          return (
            state.cardTypePanelVisibility[cardType] || {
              ...defaultPanelVisibility,
            }
          );
        },

        setCardTypePanelVisibility: (cardType, panel, visible) =>
          set((state) => {
            if (!state.cardTypePanelVisibility[cardType]) {
              state.cardTypePanelVisibility[cardType] = {
                ...defaultPanelVisibility,
              };
            }
            state.cardTypePanelVisibility[cardType][panel] = visible;
          }),

        getCardTypeLayout: (cardType) => {
          const state = get();
          return state.cardTypeLayouts[cardType] || null;
        },

        setCardTypeLayout: (cardType, layout) => {
          // First update the single layout
          set((state) => {
            state.cardTypeLayouts[cardType] = layout;
          });

          // Then add to layout states in a separate action
          set((state) => {
            if (!state.cardTypeLayoutStates[cardType]) {
              state.cardTypeLayoutStates[cardType] = [];
            }

            const states = state.cardTypeLayoutStates[cardType];
            const newState: LayoutState = {
              layout: layout,
              timestamp: Date.now(),
            };

            // Add new state
            states.push(newState);
            // Layout state added
            const panelCount = Array.isArray(layout.panels)
              ? layout.panels.length
              : typeof layout.panels === "object"
                ? Object.keys(layout.panels).length
                : 0;

            // Layout structure saved

            // Keep only the last N states
            if (states.length > state.maxLayoutStates) {
              state.cardTypeLayoutStates[cardType] = states.slice(
                -state.maxLayoutStates,
              );
              // Trimmed layout states
            }
          });
        },

        getCardTypeLayoutStates: (cardType) => {
          const state = get();
          const states = state.cardTypeLayoutStates[cardType] || [];
          // Getting layout states
          return states;
        },

        addCardTypeLayoutState: (cardType, layout) =>
          set((state) => {
            if (!state.cardTypeLayoutStates[cardType]) {
              state.cardTypeLayoutStates[cardType] = [];
            }

            const states = state.cardTypeLayoutStates[cardType];
            const newState: LayoutState = {
              layout: layout,
              timestamp: Date.now(),
            };

            // Add new state
            states.push(newState);
            // Layout state added

            // Keep only the last N states
            if (states.length > state.maxLayoutStates) {
              state.cardTypeLayoutStates[cardType] = states.slice(
                -state.maxLayoutStates,
              );
              // Trimmed layout states
            }
          }),

        getValidLayoutFromStates: (cardType, currentCardId) => {
          const state = get();
          const states = state.cardTypeLayoutStates[cardType] || [];

          // Getting valid layout from states

          if (states.length === 0) {
            // No layout states found
            return null;
          }

          // Filter valid layouts
          const validStates = states.filter((state, index) => {
            const isValid = isValidLayout(state.layout);
            if (!isValid) {
              // Invalid state found
            }
            return isValid;
          });
          // Found valid states

          if (validStates.length === 0) {
            // No valid layout states found
            return null;
          }

          // If we have at least 3 states, try to find the most common layout structure
          if (validStates.length >= 3) {
            // Group layouts by their panel configuration
            const layoutGroups = new Map<
              string,
              { layout: any; count: number }
            >();

            validStates.forEach((state) => {
              // Create a signature based on panel types and grid structure
              let panelTypes: string[] = [];

              if (Array.isArray(state.layout.panels)) {
                panelTypes = state.layout.panels.map((p: any) => {
                  const parts = p.id.split("-");
                  return parts.slice(0, -1).join("-"); // Remove card ID
                });
              } else if (typeof state.layout.panels === "object") {
                panelTypes = Object.keys(state.layout.panels).map((key) => {
                  const parts = key.split("-");
                  return parts.slice(0, -1).join("-"); // Remove card ID
                });
              }

              const signature = panelTypes.sort().join(",");

              if (layoutGroups.has(signature)) {
                const group = layoutGroups.get(signature)!;
                group.count++;
                // Keep the most recent layout of this type
                if (state.timestamp > (group.layout._timestamp || 0)) {
                  // Create a deep copy to avoid modifying frozen object
                  group.layout = {
                    ...JSON.parse(JSON.stringify(state.layout)),
                    _timestamp: state.timestamp,
                  };
                }
              } else {
                layoutGroups.set(signature, {
                  layout: {
                    ...JSON.parse(JSON.stringify(state.layout)),
                    _timestamp: state.timestamp,
                  },
                  count: 1,
                });
              }
            });

            // Find the most common layout (appears at least 3 times)
            let mostCommonLayout: any = null;
            let maxCount = 0;

            // Analyzing layout signatures
            layoutGroups.forEach(({ layout, count }, signature) => {
              if (count >= 3 && count > maxCount) {
                maxCount = count;
                mostCommonLayout = layout;
              }
            });

            if (mostCommonLayout) {
              // Found common layout pattern
              // Create a clean copy without the timestamp
              const cleanLayout = JSON.parse(JSON.stringify(mostCommonLayout));
              if (cleanLayout._timestamp) {
                delete cleanLayout._timestamp;
              }

              // Check if we need to update IDs at all
              const needsIdUpdate = Object.keys(cleanLayout.panels || {}).some(
                (key) => {
                  if (key === "card-panel-main") return false;
                  const parts = key.split("-");
                  const lastPart = parts[parts.length - 1];
                  return lastPart !== currentCardId;
                },
              );

              if (needsIdUpdate) {
                // Layout needs ID update
                return updateLayoutPanelIds(cleanLayout, currentCardId);
              } else {
                // Layout already has correct IDs
                return cleanLayout;
              }
            } else {
              // No common layout pattern found
            }
          } else {
            // Not enough states to find common pattern
          }

          // Fallback: return the most recent valid layout
          // Using most recent valid layout
          const mostRecent = validStates[validStates.length - 1];
          return updateLayoutPanelIds(mostRecent.layout, currentCardId);
        },

        resetCardTypePanelVisibility: (cardType) =>
          set((state) => {
            state.cardTypePanelVisibility[cardType] = {
              ...defaultPanelVisibility,
            };
          }),
      };
    }),
    {
      name: "card-ui-store",
      storage: new LocalPersistStorage<CardUIState>(),
      version: 2, // Increment version to force migration
      partialize: (state) =>
        ({
          cardTypePanelVisibility: state.cardTypePanelVisibility,
          cardTypeLayouts: state.cardTypeLayouts,
          cardTypeLayoutStates: state.cardTypeLayoutStates,
          maxLayoutStates: state.maxLayoutStates,
        }) as any,
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // Migration from version 0/1 to 2
          // Migrating store version
          return {
            ...persistedState,
            cardTypeLayoutStates: persistedState.cardTypeLayoutStates || {},
            maxLayoutStates: persistedState.maxLayoutStates || 4,
          };
        }
        return persistedState;
      },
    },
  ),
);

export const useCardUIStore = createSelectors(useCardUIStoreBase);
