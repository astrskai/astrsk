import { CircleAlert } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { Combobox } from "@/shared/ui/combobox";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { cn } from "@/shared/lib";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain";
import { SessionProps } from "@/modules/session/domain";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { Flow } from "@/modules/flow/domain";

const StepFlowAndAgentsSchema = z.object({
  flowId: z.string().nonempty(),
});

type StepFlowAndAgentsSchemaType = z.infer<typeof StepFlowAndAgentsSchema>;

const AgentListItem = ({
  agentId,
  isModelInvalid,
}: {
  agentId: UniqueEntityID;
  isModelInvalid?: boolean;
}) => {
  const { data: agent } = useQuery(agentQueries.detail(agentId));

  if (!agent) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-background-surface-3 relative inline-flex flex-col items-start justify-start gap-6 self-stretch rounded p-6",
        !isModelInvalid && "outline-border-light outline outline-offset-[-1px]",
      )}
    >
      <div className="inline-flex items-center justify-start gap-6">
        <div className="text-text-primary w-12 justify-start text-base font-medium">
          Agent
        </div>
        <div className="text-text-body justify-start text-base font-normal">
          {agent.props.name}
        </div>
      </div>
      <div className="inline-flex items-center justify-start gap-6">
        {isModelInvalid && (
          <CircleAlert className="text-status-destructive-light -mr-4 min-h-4 min-w-4" />
        )}
        <div className="text-text-primary w-12 justify-start text-base font-medium">
          Model
        </div>
        <div className="text-text-body justify-start text-base font-normal">
          {`${apiSourceLabel.get((agent.props.apiSource as ApiSource) ?? "openai")} - ${agent.props.modelName}`}
        </div>
      </div>
      {isModelInvalid && (
        <div
          className={cn(
            "pointer-events-none absolute inset-[-1px] rounded-lg",
            "outline-status-destructive-light outline-2",
          )}
        />
      )}
    </div>
  );
};

const StepFlowAndAgents = () => {
  const methods = useFormContext<StepFlowAndAgentsSchemaType>();
  const flowId = methods.watch("flowId");
  const isMobile = useIsMobile();

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

  return (
    <div
      className={cn(
        "flex flex-col gap-[40px]",
        isMobile ? "mx-auto w-full max-w-[600px] px-4 pb-6" : "w-[720px]",
      )}
    >
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col gap-[8px]">
          <div className="text-text-primary text-[20px] leading-[24px] font-[600]">
            Flow
          </div>
          <div
            className={cn(
              "text-text-primary text-[16px] leading-[19px] font-[400]",
              isMobile && "text-text-body text-sm leading-tight font-medium",
            )}
          >
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
            <div className="text-text-primary text-[20px] leading-[24px] font-[600]">
              Agents
            </div>
            <div
              className={cn(
                "text-text-primary text-[16px] leading-[19px] font-[400]",
                isMobile && "text-text-body text-sm leading-tight font-medium",
              )}
            >
              Listed below are the agents that make up this flow.
            </div>
          </div>
          <div className="flex flex-col gap-[24px]">
            {selectedFlow?.agentIds.map((agentId: UniqueEntityID) => (
              <AgentListItem
                key={agentId.toString()}
                agentId={agentId}
                isModelInvalid={isInvalid}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function convertFlowAndAgentsFormToSessionProps(
  values: StepFlowAndAgentsSchemaType,
): Partial<SessionProps> {
  return {
    flowId: values.flowId ? new UniqueEntityID(values.flowId) : undefined,
  };
}

export {
  convertFlowAndAgentsFormToSessionProps,
  StepFlowAndAgents,
  StepFlowAndAgentsSchema,
};
export type { StepFlowAndAgentsSchemaType };
