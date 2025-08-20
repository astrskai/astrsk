import { CircleAlert } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { UniqueEntityID } from "@/shared/domain";

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { Combobox } from "@/components-v2/combobox";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain";
import { SessionProps } from "@/modules/session/domain";
import { useQuery } from "@tanstack/react-query";
import { flowQueries } from "@/app/queries/flow-queries";
import { agentQueries } from "@/app/queries/agent/query-factory";

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
        "relative self-stretch p-6 bg-background-surface-3 rounded inline-flex flex-col justify-start items-start gap-6",
        !isModelInvalid && "outline outline-offset-[-1px] outline-border-light",
      )}
    >
      <div className="inline-flex justify-start items-center gap-6">
        <div className="w-12 justify-start text-text-primary text-base font-medium">
          Agent
        </div>
        <div className="justify-start text-text-body text-base font-normal">
          {agent.props.name}
        </div>
      </div>
      <div className="inline-flex justify-start items-center gap-6">
        {isModelInvalid && (
          <CircleAlert className="min-w-4 min-h-4 text-status-destructive-light -mr-4" />
        )}
        <div className="w-12 justify-start text-text-primary text-base font-medium">
          Model
        </div>
        <div className="justify-start text-text-body text-base font-normal">
          {`${apiSourceLabel.get((agent.props.apiSource as ApiSource) ?? "openai")} - ${agent.props.modelName}`}
        </div>
      </div>
      {isModelInvalid && (
        <div
          className={cn(
            "absolute inset-[-1px] rounded-lg pointer-events-none",
            "outline-2 outline-status-destructive-light",
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
        isMobile ? "w-full max-w-[600px] mx-auto px-4 pb-6" : "w-[720px]",
      )}
    >
      <div className="flex flex-col gap-[24px]">
        <div className="flex flex-col gap-[8px]">
          <div className="font-[600] text-[20px] leading-[24px] text-text-primary">
            Flow
          </div>
          <div
            className={cn(
              "font-[400] text-[16px] leading-[19px] text-text-primary",
              isMobile && "text-text-body text-sm font-medium leading-tight",
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
              options={flows?.map((flow) => ({
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
            <div className="font-[600] text-[20px] leading-[24px] text-text-primary">
              Agents
            </div>
            <div
              className={cn(
                "font-[400] text-[16px] leading-[19px] text-text-primary",
                isMobile && "text-text-body text-sm font-medium leading-tight",
              )}
            >
              Listed below are the agents that make up this flow.
            </div>
          </div>
          <div className="flex flex-col gap-[24px]">
            {selectedFlow?.agentIds.map((agentId) => (
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
