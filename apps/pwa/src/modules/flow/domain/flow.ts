import { Result } from "@/shared/core/result";
import { AggregateRoot, UniqueEntityID } from "@/shared/domain";
import { PartialOmit } from "@/shared/utils";
import type { ValidationIssue } from "@/flow-multi/validation/types/validation-types";

export enum TaskType {
  AiResponse = "ai_response",
  UserResponse = "user_response",
}

export enum ReadyState {
  Draft = "draft",
  Ready = "ready",
  Error = "error",
}

// TODO: change name to `FlowNode`
export type Node = {
  id: string;
  type: "start" | "end" | "agent" | "if";
  position: {
    x: number;
    y: number;
  };
  data: object;
  deletable?: boolean;
  draggable?: boolean;
  zIndex?: number; // Controls the layering order of nodes
};

// TODO: change name to `FlowEdge`
export type Edge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null; // Handle ID on source node (e.g., "true"/"false" for if-nodes)
  targetHandle?: string | null; // Handle ID on target node
  label?: string; // Optional label for visualization (e.g., "True"/"False" for if-nodes)
};

export type PanelLayout = {
  id: string;
  component: string;
  title: string;
  position?: {
    direction?: "left" | "right" | "above" | "below" | "within"; // Added 'within' for tabbed panels
    referencePanel?: string;
    referenceGroup?: string; // Added for group-based positioning
  };
  groupInfo?: {
    groupId: string;
    panelIndex: number;
    groupPanels: string[];
    isActiveInGroup: boolean;
  };
  params?: Record<string, any>;
  size?: {
    width?: number;
    height?: number;
  };
};

export type PanelStructure = {
  panels: PanelLayout[];
  activePanel?: string;
  version: number; // For future migrations
  serializedLayout?: any; // Dockview's native serialization
  panelMetadata?: Record<string, any>; // Panel metadata for consistent ID restoration
};

export type FlowViewport = {
  x: number;
  y: number;
  zoom: number;
};

// Data Store Schema types
export type DataStoreFieldType = 'string' | 'number' | 'boolean' | 'integer';

// Schema definition - defines the structure
export interface DataStoreSchemaField {
  id: string; // Will use UniqueEntityID().toString()
  name: string;
  type: DataStoreFieldType;
  initialValue: string; // Store as string, parse based on type
  description?: string;
}

// Runtime field - contains actual values and logic
export interface DataStoreField {
  schemaFieldId: string; // References DataStoreSchemaField.id
  value: string; // Current value (stored as string)
  logic?: string; // Optional logic/formula for computed fields
}

export interface DataStoreSchema {
  fields: DataStoreSchemaField[];
  version?: number; // For future migrations
}

export interface FlowProps {
  // Metadata
  name: string;
  description: string;

  // Agent Graph
  nodes: Node[];
  edges: Edge[];

  // Response Design
  responseTemplate: string;

  // Data Store Schema
  dataStoreSchema?: DataStoreSchema;

  // Panel Layout
  panelStructure?: PanelStructure;

  // Flow Viewport State
  viewport?: FlowViewport;

  // Validation State
  readyState: ReadyState;
  validationIssues?: ValidationIssue[];

  // Set by System
  createdAt: Date;
  updatedAt?: Date;
}

export type CreateFlowProps = PartialOmit<FlowProps, "createdAt" | "updatedAt">;
export type UpdateFlowProps = Partial<CreateFlowProps>;

export class Flow extends AggregateRoot<FlowProps> {
  get agentIds(): UniqueEntityID[] {
    return this.props.nodes
      .filter((node) => node.type === "agent")
      .map((node) => new UniqueEntityID(node.id));
  }

  public static create(
    props: CreateFlowProps,
    id?: UniqueEntityID,
  ): Result<Flow> {
    // TODO: add validation

    // Create new flow
    const flow = new Flow(
      {
        // Default values for required props
        name: "",
        description: "",
        nodes: [],
        edges: [],
        responseTemplate: "",
        panelStructure: undefined, // No panels by default
        readyState: ReadyState.Draft, // Default to draft state

        // Spread input props
        ...props,

        // Set by System
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id ?? new UniqueEntityID(),
    );

    // Return created flow
    return Result.ok(flow);
  }

  public update(props: Partial<UpdateFlowProps>): Result<Flow> {
    try {
      // Determine if structural changes are being made
      const hasStructuralChanges = 
        props.nodes !== undefined || 
        props.edges !== undefined || 
        props.responseTemplate !== undefined;
      
      // Determine the new ready state
      let newReadyState = this.props.readyState;
      
      // If readyState is explicitly provided, use it
      if (props.readyState !== undefined) {
        newReadyState = props.readyState;
      } else if (hasStructuralChanges && this.props.readyState === ReadyState.Ready) {
        // Only reset from Ready to Draft on structural changes
        // Error state persists through structural changes
        newReadyState = ReadyState.Draft;
      }
      
      // Update flow props
      Object.assign(this.props, { 
        ...props,
        readyState: newReadyState,
      });

      // Refresh `updatedAt`
      this.props.updatedAt = new Date();

      // Return success
      return Result.ok(this);
    } catch (error) {
      console.error(error);
      return Result.fail(`Failed to update flow: ${error}`);
    }
  }

  public setReadyState(readyState: ReadyState): Result<Flow> {
    return this.update({ readyState });
  }

  public toJSON(): any {
    // Create the base structure similar to the default flow format
    const json: any = {
      name: this.props.name,
      description: this.props.description,
      nodes: this.props.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        deletable: node.deletable,
      })),
      edges: this.props.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      })),
      responseTemplate: this.props.responseTemplate,
      createdAt: this.props.createdAt?.toISOString(),
      updatedAt: this.props.updatedAt?.toISOString(),
    };

    // Add optional fields if they exist
    if (this.props.panelStructure) {
      json.panelStructure = this.props.panelStructure;
    }
    if (this.props.viewport) {
      json.viewport = this.props.viewport;
    }
    
    // Add validation state fields
    json.readyState = this.props.readyState;
    if (this.props.validationIssues) {
      json.validationIssues = this.props.validationIssues;
    }

    return json;
  }

  public static fromJSON(json: any): Result<Flow> {
    try {
      // Spread JSON
      const { id, ...props } = json;

      // Create flow from JSON
      const flow = new Flow(
        {
          ...props,
          nodes: (() => {
            // Handle duplicate node IDs
            const seenNodeIds = new Set<string>();
            const uniqueNodes: any[] = [];

            props.nodes?.forEach((node: any) => {
              if (seenNodeIds.has(node.id)) {
                return;
              }

              seenNodeIds.add(node.id);

              // Ensure start and end nodes have high z-index
              let zIndex = node.zIndex;
              if (node.type === "start" || node.type === "end") {
                zIndex = zIndex ?? 1000; // Use 1000 if not already set
              }

              uniqueNodes.push({
                ...node,
                zIndex,
              });
            });

            return uniqueNodes;
          })(),
          edges:
            props.edges?.map((edge: any) => ({
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle || null,
              targetHandle: edge.targetHandle || null,
              label: edge.label,
            })) || [],
          panelStructure: props.panelStructure,
          viewport: props.viewport,
          isTemporary: props.isTemporary ?? false,
          readyState: props.readyState || ReadyState.Draft,
          validationIssues: props.validationIssues || undefined,
        },
        new UniqueEntityID(id),
      );

      // Return created flow
      return Result.ok(flow);
    } catch (error) {
      return Result.fail(`Failed to create flow from JSON: ${error}`);
    }
  }
}
