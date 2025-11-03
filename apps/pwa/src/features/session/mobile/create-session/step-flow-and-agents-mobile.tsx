import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useFlowValidation } from "@/shared/hooks/use-flow-validation";
import { Combobox, TypoXLarge } from "@/shared/ui";
import { ApiSource, apiSourceLabel } from "@/entities/api/domain";
import { Agent } from "@/entities/agent/domain";
import { Flow, Node } from "@/entities/flow/domain";
import { useQuery, useQueries } from "@tanstack/react-query";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { AgentListItemMobile } from "../components/agent-list-item-mobile";

// Re-export schema and converter from the shared step
export {
  StepFlowAndAgentsSchema,
  convertFlowAndAgentsFormToSessionProps,
} from "@/features/session/create-session/step-flow-and-agents";
export type StepFlowAndAgentsSchemaType = z.infer<
  typeof import("@/features/session/create-session/step-flow-and-agents").StepFlowAndAgentsSchema
>;

// Mobile Step Flow and Agents Component
export const StepFlowAndAgentsMobile = () => {
  const methods = useFormContext<StepFlowAndAgentsSchemaType>();
  const flowId = methods.watch("flowId");

  // Select flow
  const { data: flows } = useQuery(flowQueries.list());
  const { data: selectedFlow } = useQuery(
    flowQueries.detail(flowId ? new UniqueEntityID(flowId) : undefined),
  );

  // Flow validation
  const { isValid: isFlowValid, isFetched: isFlowFetched } = useFlowValidation(
    selectedFlow?.id,
  );
  const isInvalid = isFlowFetched && !isFlowValid;

  // Get agent IDs from flow nodes
  const agentIds =
    selectedFlow?.props.nodes
      .filter((node: Node) => node.type === "agent")
      .map((node: Node) => new UniqueEntityID(node.id)) || [];

  // Fetch agent data for all agents in the flow
  const agentQueries_ = useQueries({
    queries: agentIds.map((id: UniqueEntityID) => ({
      ...agentQueries.detail(id),
      enabled: !!id,
    })),
  });

  // Extract loaded agents
  const agents = agentQueries_
    .filter((q) => q.data)
    .map((q) => q.data as Agent);

  // Create a map of node ID to agent data for easy lookup
  const agentMap = new Map<string, Agent>();
  agents.forEach((agent: Agent) => {
    agentMap.set(agent.id.toString(), agent);
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-[40px] overflow-y-auto p-[16px] pb-0">
        <div className="flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[8px]">
            <TypoXLarge className="text-text-primary font-semibold">
              Flow
            </TypoXLarge>
            <div className="text-text-body text-sm leading-tight font-medium">
              Choose a flow (a bundle of prompt preset and AI model) to use for
              your session.
            </div>
          </div>
          <Controller
            control={methods.control}
            name="flowId"
            render={({ field: { onChange, value } }) => (
              <Combobox
                label="Flow"
                triggerPlaceholder="Flow"
                searchPlaceholder="Search flows..."
                searchEmpty="No flow found."
                options={flows?.map((flow: Flow) => ({
                  value: flow.id.toString(),
                  label: flow.props.name,
                }))}
                value={value}
                onValueChange={(selectedValue) => {
                  onChange(selectedValue);
                }}
                forceMobile={true}
              />
            )}
          />
        </div>

        {selectedFlow && (
          <div className="flex flex-col gap-[24px]">
            <div className="flex flex-col gap-[8px]">
              <div className="text-text-primary text-[18px] leading-[24px] font-[600]">
                Agents
              </div>
              <div className="text-text-body text-sm leading-tight font-medium">
                Listed below are the agents that make up this flow.
              </div>
            </div>
            <div className="flex flex-col gap-[16px]">
              {selectedFlow?.props.nodes
                .filter((node: Node) => node.type === "agent")
                .map((node: Node) => {
                  const agent = agentMap.get(node.id);
                  const agentName = agent?.props.name || "Loading...";
                  const modelName = agent
                    ? `${apiSourceLabel.get((agent.props.apiSource as ApiSource) ?? "openai")} - ${agent.props.modelName}`
                    : "Loading...";

                  return (
                    <AgentListItemMobile
                      key={node.id}
                      agentName={agentName}
                      modelName={modelName}
                      isModelInvalid={isInvalid}
                    />
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
