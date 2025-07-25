import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { CustomSheet } from "@/components-v2/custom-sheet";
import { cn } from "@/components-v2/lib/utils";
import {
  convertFlowAndAgentsFormToSessionProps,
  StepFlowAndAgents,
  StepFlowAndAgentsSchema,
  StepFlowAndAgentsSchemaType,
} from "@/components-v2/session/create-session/step-flow-and-agents";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { CarouselItem } from "@/components-v2/ui/carousel";
import { SessionProps } from "@/modules/session/domain";
import { useQuery } from "@tanstack/react-query";
import { agentQueries } from "@/app/queries/agent-queries";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain/api-connection";

const AgentListItem = ({
  agentId,
}: {
  agentId: UniqueEntityID;
}) => {
  const { data: agent } = useQuery(agentQueries.detail(agentId));

  if (!agent) {
    return null;
  }

  return (
    <CarouselItem className="basis-1/3 pl-4 py-4">
      <div
        className={cn(
          "p-6 rounded-lg flex flex-col gap-6",
          "bg-background-surface-3 outline-1 outline-border-light",
        )}
      >
        <div className="flex flex-col gap-2">
          <div className="text-text-body text-base font-normal">Agent</div>
          <div className="text-text-primary text-base font-medium">
            {agent.props.name}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-text-body text-base font-normal">Model</div>
          <div className="text-text-primary text-base font-medium">
            {`${apiSourceLabel.get((agent.props.apiSource as ApiSource) ?? "openai")} - ${agent.props.modelName}`}
          </div>
        </div>
      </div>
    </CarouselItem>
  );
};

const EmptyFlow = () => {
  return (
    <CarouselItem className="basis-1/3 pl-[24px] py-[24px]">
      <div
        className={cn(
          "relative w-[280px] h-[164px] rounded-[8px] grid place-content-center",
          "bg-background-input",
        )}
      >
        <div className="flex flex-col gap-[16px] items-center text-background-dialog">
          <div className="font-[500] text-[12px] leading-[15px]">
            Connect a flow to drive your scene
          </div>
        </div>
      </div>
    </CarouselItem>
  );
};

const EditFlowAndAgents = ({
  defaultValue,
  onSave,
  trigger,
}: {
  defaultValue: { flowId: string };
  onSave: (newValue: Partial<SessionProps>) => Promise<void>;
  trigger?: React.ReactNode;
}) => {
  // Use form
  const methods = useForm<StepFlowAndAgentsSchemaType>({
    resolver: zodResolver(StepFlowAndAgentsSchema),
  });

  // Validate flow
  const flowId = methods.watch("flowId");
  const { isValid } = useFlowValidation(
    flowId ? new UniqueEntityID(flowId) : null,
  );

  // Auto-save on form changes
  useEffect(() => {
    const subscription = methods.watch(async (value) => {
      if (value.flowId) {
        await onSave({
          ...convertFlowAndAgentsFormToSessionProps(value as StepFlowAndAgentsSchemaType),
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, onSave]);

  return (
    <CustomSheet
      title="Flow & Agent"
      trigger={trigger ?? <SvgIcon name="edit" size={24} />}
      onOpenChange={(open) => {
        if (open) {
          methods.reset({
            ...defaultValue,
          });
        }
      }}
    >
      <FormProvider {...methods}>
        <StepFlowAndAgents />
      </FormProvider>
    </CustomSheet>
  );
};

export { AgentListItem, EditFlowAndAgents, EmptyFlow };
