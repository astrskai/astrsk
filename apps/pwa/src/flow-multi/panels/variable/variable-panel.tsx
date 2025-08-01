import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { Target, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Variable, VariableLibrary, VariableGroupLabel } from "@/shared/prompt/domain/variable";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { SearchInput } from "@/components-v2/search-input";
import { 
  useFlowPanel, 
  FlowPanelLoading, 
  FlowPanelError 
} from "@/flow-multi/hooks/use-flow-panel";
import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { VariablePanelProps } from "./variable-panel-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components-v2/ui/tabs";
import { Database } from "lucide-react";
import { SchemaField, OutputFormat, SchemaFieldType, Agent } from "@/modules/agent/domain/agent";
import { sanitizeFileName } from "@/shared/utils/file-utils";
import { getAgentHexColor } from "@/flow-multi/utils/agent-color-assignment";
import { TypoBase, TypoLarge } from "@/components-v2/typo";
import { useQueries } from "@tanstack/react-query";
import { agentQueries } from "@/app/queries/agent-queries";

interface AgentVariable {
  agentId: string;
  agentName: string;
  agentColor: string;
  field: SchemaField;
  variablePath: string;
}

export function VariablePanel({ flowId }: VariablePanelProps) {
  // Use the flow panel hook
  const { 
    flow,
    isLoading,
  } = useFlowPanel({ flowId });

  // Get last monaco editor and insert function from flow context
  const { lastMonacoEditor, insertVariableAtLastCursor } = useFlowPanelContext();
  // Removed agentUpdateTimestamp and flowUpdateTimestamp - React Query handles updates
  
  // Local state
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = sessionStorage.getItem('variablePanel_activeTab');
    return savedTab === 'structured' ? 'structured' : 'variables';
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [availableVariables, setAvailableVariables] = useState<Variable[]>([]);
  const [aggregatedStructuredVariables, setAggregatedStructuredVariables] = useState<AgentVariable[]>([]);
  const [clickedVariable, setClickedVariable] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Check if we have an editor
  const hasEditor = !!lastMonacoEditor?.editor;

  // Load variables from library
  useEffect(() => {
    const libraryVariables = VariableLibrary.variableList;
    // Filter out message-related variables, keep only core template variables
    const filteredLibraryVariables = libraryVariables.filter(
      (variable: Variable) =>
        !variable.variable.includes("message") &&
        !variable.variable.includes("history") &&
        !variable.dataType.toLowerCase().includes("message"),
    );
    setAvailableVariables(filteredLibraryVariables);
  }, []);

  // Get agent IDs from flow
  const agentIds = useMemo(() => {
    if (!flow) return [];
    
    // Flow has agentIds array directly
    const ids = flow.agentIds || [];
    return ids;
  }, [flow]);

  // Query all agents
  const agentQueries_ = useQueries({
    queries: agentIds.map(id => ({
      ...agentQueries.detail(id),
      enabled: !!id,
    })),
  });

  // Check if all agents are loaded
  const areAgentsLoading = agentQueries_.some(q => q.isLoading);
  
  // Use state and ref to manage variables with stable updates
  const previousAgentDataRef = useRef<string>('');
  
  useEffect(() => {
    const agents = agentQueries_
      .filter(q => q.data && !q.isLoading)
      .map(q => q.data as Agent);
    
    if (!flow || areAgentsLoading || agents.length === 0) {
      if (aggregatedStructuredVariables.length > 0) {
        setAggregatedStructuredVariables([]);
      }
      return;
    }

    // Create a stable key from relevant agent properties
    const agentDataKey = agents.map(agent => ({
      id: agent.id.toString(),
      name: agent.props.name,
      outputFormat: agent.props.outputFormat,
      enabledStructuredOutput: agent.props.enabledStructuredOutput,
      schemaFields: agent.props.schemaFields?.map(field => ({
        name: field.name,
        type: field.type,
        description: field.description,
        required: field.required,
        array: field.array,
      })) || [],
    }));
    
    const currentAgentData = JSON.stringify(agentDataKey);
    
    // Only update if the relevant agent data has actually changed
    if (previousAgentDataRef.current === currentAgentData) {
      return;
    }
    
    previousAgentDataRef.current = currentAgentData;

    const variables: AgentVariable[] = [];

    // Iterate through all agents
    agents.forEach((agent) => {
      const agentId = agent.id.toString();
      const agentName = agent.props.name || "Unnamed Agent";
      const agentColor = getAgentHexColor(agent);

      // Check the output format
      const outputFormat = agent.props.outputFormat || OutputFormat.StructuredOutput;

      if (outputFormat === OutputFormat.TextOutput) {
        // For text output, add single .response variable
        const sanitizedAgentName = sanitizeFileName(agentName);
        const variablePath = `${sanitizedAgentName}.response`;

        variables.push({
          agentId,
          agentName,
          agentColor,
          field: {
            name: "response",
            description: "Text response from the agent",
            required: true,
            array: false,
            type: SchemaFieldType.String,
          },
          variablePath,
        });
      } else if (
        agent.props.enabledStructuredOutput &&
        agent.props.schemaFields &&
        agent.props.schemaFields.length > 0
      ) {
        // For structured output, add each field
        agent.props.schemaFields.forEach((field) => {
          const fieldPath = field.array ? `${field.name}[]` : field.name;
          const sanitizedAgentName = sanitizeFileName(agentName);
          const variablePath = `${sanitizedAgentName}.${fieldPath}`;

          variables.push({
            agentId,
            agentName,
            agentColor,
            field,
            variablePath,
          });
        });
      }
    });
    
    setAggregatedStructuredVariables(variables);
  }, [flow, areAgentsLoading, agentQueries_, aggregatedStructuredVariables.length]);


  // Group variables by their group property
  const groupedVariables = useMemo(() => {
    const groups = availableVariables.reduce((acc, variable) => {
      const group = variable.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(variable);
      return acc;
    }, {} as Record<string, Variable[]>);

    // Filter by search query if exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      Object.keys(groups).forEach(groupKey => {
        groups[groupKey] = groups[groupKey].filter(
          (variable) =>
            variable.variable.toLowerCase().includes(query) ||
            variable.description.toLowerCase().includes(query) ||
            (variable.template && variable.template.toLowerCase().includes(query)),
        );
        // Remove empty groups after filtering
        if (groups[groupKey].length === 0) {
          delete groups[groupKey];
        }
      });
    }

    return groups;
  }, [availableVariables, searchQuery]);


  // Handle structured variable insertion
  const handleInsertStructuredVariable = useCallback(
    (variablePath: string, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const variableValue = `{{${variablePath}}}`;
      setClickedVariable(variablePath);

      if (lastMonacoEditor && lastMonacoEditor.editor && lastMonacoEditor.position) {
        insertVariableAtLastCursor(variableValue);
        toast.success(`Inserted: ${variableValue}`, {
          duration: 2000,
        });
      } else {
        toast.warning("No fields are selected to input the variables", {
          duration: 2000,
        });
      }

      setTimeout(() => {
        setClickedVariable(null);
      }, 1000);
    },
    [lastMonacoEditor, insertVariableAtLastCursor]
  );

  // Handle variable click for insertion
  const handleVariableClick = useCallback(
    (variable: Variable, event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const variableTemplate = `{{${variable.variable}}}`;
      setClickedVariable(variable.variable);

      if (lastMonacoEditor && lastMonacoEditor.editor && lastMonacoEditor.position) {
        insertVariableAtLastCursor(variableTemplate);
        // No toast for regular variables to match original behavior
      } else {
        toast.warning("No fields are selected to input the variables", {
          duration: 2000,
        });
      }

      setTimeout(() => {
        setClickedVariable(null);
      }, 1000);
    },
    [lastMonacoEditor, insertVariableAtLastCursor]
  );

  // Prevent focus steal on mouse down
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Prevent panel activation on any interaction
  const handlePanelInteraction = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  // Handle group collapse/expand
  const toggleGroupCollapse = useCallback((group: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  }, []);

  // Loading state
  if (isLoading || areAgentsLoading) {
    return <FlowPanelLoading message="Loading variables..." />;
  }

  // Error state
  if (!flow) {
    return <FlowPanelError message="Flow not found" />;
  }

  return (
    <div
      className="h-full p-4 bg-background-surface-2 flex flex-col justify-start items-center gap-4 overflow-hidden"
      onClick={handlePanelInteraction}
    >
      <SearchInput
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full flex-shrink-0"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          sessionStorage.setItem('variablePanel_activeTab', value);
          // Clear search when switching tabs
          setSearchQuery("");
        }}
        className="w-full flex flex-col gap-4 flex-1 overflow-hidden"
      >
        <TabsList className="w-full flex-shrink-0">
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="structured">Agent output</TabsTrigger>
        </TabsList>

        <TabsContent value="variables" className="mt-0 flex-1 overflow-hidden h-0">
          <ScrollArea className="h-full pr-2">
            <div className="flex flex-col">
              {Object.keys(groupedVariables).length === 0 ? (
                <div className="text-center py-8">
                  <TypoBase className="text-[#A3A5A8]">
                    {searchQuery
                      ? "No variables found matching your search"
                      : "No variables available"}
                  </TypoBase>
                </div>
              ) : (
                Object.entries(groupedVariables).map(([group, variables]) => (
                  <div key={group} className="flex flex-col">
                    {/* Group Header */}
                    <div className="bg-[#272727] py-2.5">
                      <div className="flex flex-row gap-4 items-center justify-start w-full">
                        <div className="basis-0 flex flex-row gap-2 grow items-start justify-start text-xs text-left">
                          <div className="text-[#bfbfbf] font-medium text-nowrap">
                            {VariableGroupLabel[group as keyof typeof VariableGroupLabel]?.displayName || group}
                          </div>
                          <div className="basis-0 grow min-h-px min-w-px text-[#696969] font-normal">
                            {VariableGroupLabel[group as keyof typeof VariableGroupLabel]?.description || "Variables in this group"}
                          </div>
                        </div>
                        <button 
                          className="flex items-center justify-center"
                          onClick={() => toggleGroupCollapse(group)}
                        >
                          {collapsedGroups.has(group) ? (
                            <ChevronDown className="min-w-6 min-h-6 text-[#bfbfbf]" />
                          ) : (
                            <ChevronUp className="min-w-6 min-h-6 text-[#bfbfbf]" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Group Variables */}
                    {!collapsedGroups.has(group) && (
                      <div className="bg-[#272727] pb-0">
                        <div className="flex flex-col gap-2">
                          {variables.map((variable) => (
                          <button
                            key={variable.variable}
                            className={`w-full p-2 rounded-lg bg-[#313131] border border-[#525252] flex flex-col justify-start items-start gap-1 transition-all duration-200 text-left relative ${
                              clickedVariable === variable.variable
                                ? "bg-[#313131]"
                                : "bg-[#313131] hover:bg-[#414141] cursor-pointer"
                            }`}
                            onClick={(e) => handleVariableClick(variable, e)}
                            onMouseDown={handleMouseDown}
                            tabIndex={-1}
                          >
                            {clickedVariable === variable.variable && (
                              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500" />
                            )}
                            <div className="w-full flex flex-col justify-start items-start gap-1">
                              <div className="flex justify-start items-center gap-2 w-full text-xs text-nowrap">
                                <div className="text-[#f1f1f1] font-medium">
                                  {`{{${variable.variable}}}`}
                                </div>
                                <div className="text-[#bfbfbf] font-normal">
                                  {variable.dataType}
                                </div>
                                {hasEditor &&
                                  (clickedVariable === variable.variable ? (
                                    <Check className="min-w-3 min-h-3 ml-auto text-green-500 transition-opacity" />
                                  ) : (
                                    <Target className="min-w-3 min-h-3 ml-auto text-primary opacity-0 hover:opacity-100 transition-opacity" />
                                  ))}
                              </div>
                              <div className="text-[#9d9d9d] text-xs font-normal leading-normal text-left">
                                {variable.description}
                              </div>
                              {variable.template && (
                                <div className="text-[#bfbfbf] text-[10px] font-medium leading-4 whitespace-pre-wrap">
                                  <span className="text-[#f1f1f1]">
                                    {variable.template}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="structured" className="mt-0 flex-1 overflow-hidden h-0">
          <ScrollArea className="h-full pr-2">
            <div className="flex flex-col gap-2">
              {aggregatedStructuredVariables.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto" />
                  <TypoLarge className="text-muted-foreground">
                    {searchQuery
                      ? "No structured output variables found matching your search"
                      : "No structured output variables found"}
                  </TypoLarge>
                  <TypoBase className="text-muted-foreground">
                    {searchQuery
                      ? "Try a different search term"
                      : "Enable structured output on agents to see variables here"}
                  </TypoBase>
                </div>
              ) : (
                aggregatedStructuredVariables
                  .filter((variable) => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      variable.field.name.toLowerCase().includes(query) ||
                      variable.agentName.toLowerCase().includes(query) ||
                      (variable.field.description &&
                        variable.field.description.toLowerCase().includes(query))
                    );
                  })
                  .map((variable, index) => {
                    const variableKey = variable.variablePath;
                    return (
                      <div key={`${variable.agentId}-${index}`} className="relative">
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-lg"
                          style={{ backgroundColor: variable.agentColor }}
                        />
                        <button
                          className={`w-full ml-[2px] p-2 rounded-lg flex flex-col justify-start items-start gap-1 transition-all duration-200 text-left relative ${
                            clickedVariable === variableKey
                              ? "bg-background-surface-3"
                              : "bg-background-surface-3 hover:bg-background-surface-4 cursor-pointer"
                          }`}
                          onClick={(e) =>
                            handleInsertStructuredVariable(
                              variable.variablePath,
                              e
                            )
                          }
                          onMouseDown={handleMouseDown}
                          tabIndex={-1}
                        >
                          {clickedVariable === variableKey && (
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-500" />
                          )}
                          <div className="w-full flex flex-col justify-start items-start gap-1">
                            <div className="flex justify-start items-center gap-2 w-full">
                              <div
                                className="text-xs font-normal"
                                style={{ color: variable.agentColor }}
                              >
                                {`{{${variable.variablePath}}}`}
                              </div>
                              <div className="text-text-body text-xs font-normal">
                                {variable.field.type}
                              </div>
                              {variable.field.required && (
                                <div className="text-red-500 text-xs font-normal">
                                  required
                                </div>
                              )}
                              {hasEditor &&
                                (clickedVariable === variableKey ? (
                                  <Check className="h-3 w-3 ml-auto text-green-500 transition-opacity" />
                                ) : (
                                  <Target className="h-3 w-3 ml-auto text-primary opacity-0 hover:opacity-100 transition-opacity" />
                                ))}
                            </div>
                            {variable.field.description && (
                              <div className="line-clamp-3 text-text-subtle text-xs font-medium leading-none text-left">
                                {variable.field.description}
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}