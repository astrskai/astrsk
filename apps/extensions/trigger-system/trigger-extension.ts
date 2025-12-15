/**
 * Trigger System Extension
 *
 * Multi-path flow execution with user-defined response designs.
 * Milestone 1: Database foundation complete
 * Milestone 2: Auto-add scenario nodes to flows
 */

import {
  IExtension,
  IExtensionClient,
  ExtensionMetadata,
} from "../../pwa/src/features/extensions/core/types";
import {
  createScenarioStartNode,
  createUserStartNode,
  hasScenarioNodes,
  hasUserNodes,
} from "./utils/scenario-node-factory";

export class TriggerSystemExtension implements IExtension {
  metadata: ExtensionMetadata = {
    id: "trigger-system",
    name: "Trigger System",
    version: "0.1.0",
    description: "Multi-path flow execution (MVP)",
    author: "Astrsk",
  };

  /**
   * Trigger types provided by this extension
   * Each trigger type corresponds to a start node variant
   * Future: Can add more trigger types like "event", "schedule", etc.
   */
  private readonly triggerTypes = ["scenario", "user"] as const;

  /**
   * Astrsk logo SVG embedded as data URI
   * Using minimalist contrast: soft off-white (#e5e7eb) logo on dark grey (#1f2937) background
   * Optimized for 36px (mobile) and 48px (desktop) avatar sizes
   */
  private readonly ASTRSK_LOGO_SVG = 'data:image/svg+xml;base64,' + btoa(
    '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100" height="100" rx="12" fill="#1f2937"/>' +
    '<g transform="translate(50, 50)">' +
    '<g transform="translate(-24.25, -23.5) scale(0.5)">' +
    '<path fill-rule="evenodd" clip-rule="evenodd" d="M37.4984 93.5L41.0688 54.2126L7.75947 76.6532L0.5 63.84L35.8935 46.7131L1.30861 30.1367L8.34011 17.3714L41.0742 39.53L37.5004 0.5L52.1273 0.5L49.142 39.6237L80.4707 17.4066L87.6912 30.151L53.136 46.7131L88.5 63.8257L81.0412 76.635L49.1468 54.4395L52.1273 93.5H37.4984Z" fill="#e5e7eb"/>' +
    '</g>' +
    '</g>' +
    '</svg>'
  );

  private client: IExtensionClient | null = null;

  async onLoad(client: IExtensionClient): Promise<void> {
    this.client = client;

    // Register Scenario variable group
    client.registerVariableGroup("scenario", {
      displayName: "Scenario",
      description: "Variables related to the plot/scenario.",
    });

    // Register Scenario object type for variable expansion
    client.registerObjectType("Scenario", ["id", "name", "description", "entries"]);

    // Register scenario variables
    client.registerVariables([
      {
        group: "scenario",
        variable: "scenario.id",
        description: "The unique ID of the scenario.",
        dataType: "string",
      },
      {
        group: "scenario",
        variable: "scenario.name",
        description: "The name of the scenario.",
        dataType: "string",
      },
      {
        group: "scenario",
        variable: "scenario.description",
        description: "The description of the scenario.",
        dataType: "string",
      },
      {
        group: "scenario",
        variable: "scenario.entries",
        description: "A list of all retrieved lorebook entries for the scenario.",
        dataType: "string[]",
        template: "\n{% for entry in scenario.entries %}\n  {{entry}}\n{% endfor %}\n",
      },
    ]);

    // Listen for flow creation events (async, non-blocking)
    client.onEvent("flow:created", async (context) => {
      await this.addTriggerNodesIfMissing(context);
    });

    // Listen for flow load events (sync, can block)
    client.on("flow:afterLoad", async (context) => {
      await this.addTriggerNodesIfMissing(context);
    });

    // Register trigger button in session input
    client.registerUIComponent({
      id: "trigger-button",
      slot: "session-input-buttons",
      order: 0, // Display first, before user character button
      render: (context, hooks, queries) => {
        const { React, components, sessionId } = context;
        const { UserInputCharacterButton } = components;
        const { useQuery } = hooks;
        const { sessionQueries, CardType } = queries;

        // Reactively query session to get allCards
        // When session cards change, button automatically re-renders
        const { data: session } = useQuery(sessionQueries.detail(sessionId));

        // Find plot/scenario card from session.allCards
        // Check for both CardType.Plot (deprecated) and CardType.Scenario (preferred)
        const plotCardListItem = session?.allCards?.find(
          (card: any) => card.type === CardType.Plot || card.type === CardType.Scenario
        );

        // If no plot card defined, don't show button
        if (!plotCardListItem) {
          return null;
        }

        const plotCardId = plotCardListItem.id;

        // Render button with hexagon avatar and "Scenario" label
        // Use astrsk logo instead of the plot/scenario card's icon
        return React.createElement(UserInputCharacterButton, {
          characterCardId: plotCardId,
          iconSrc: this.ASTRSK_LOGO_SVG, // Embedded astrsk logo
          onClick: () => {
            // Don't trigger during inference
            if (context.disabled) return;
            // Execute scenario flow from scenario start node
            // Pass trigger type from extension's trigger types array
            context.generateCharacterMessage?.(
              plotCardId,
              undefined,
              this.triggerTypes[0] // "scenario"
            );
            context.onCharacterButtonClicked?.();
          },
          isDisabled: context.disabled,
          showName: false, // Hide card name, use label instead
          label: "Scenario", // Show "Scenario" as label
          shape: "hexagon", // Hexagon shape for scenario
        });
      },
    });
  }

  /**
   * Add trigger start nodes to flow if they don't exist
   * Adds both scenario and user start nodes
   * Reused for both flow:created event and flow:afterLoad hook
   */
  private async addTriggerNodesIfMissing(context: any): Promise<void> {
    const { flow } = context;
    if (!flow) {
      console.warn("🎯 [Trigger] Missing flow data in context");
      return;
    }

    try {
      // Flow is a domain entity - access nodes via props
      const nodes = flow.props?.nodes || [];
      const flowId = flow.id?.toString() || flow.id;

      const nodesToAdd: any[] = [];

      // Check if flow needs user start node (added first for level consistency)
      if (!hasUserNodes(nodes)) {
        nodesToAdd.push(createUserStartNode());
      }

      // Check if flow needs scenario start node
      if (!hasScenarioNodes(nodes)) {
        nodesToAdd.push(createScenarioStartNode());
      }

      // If no nodes to add, return early
      if (nodesToAdd.length === 0) {
        return;
      }

      // Add nodes to flow through extension API
      await this.client!.api.addNodesToFlow({
        flowId: flowId,
        nodes: nodesToAdd,
      });
    } catch (error) {
      console.error("❌ [Trigger] Failed to add trigger nodes:", error);
    }
  }

  async onUnload(): Promise<void> {
    // Extension cleanup
  }
}
