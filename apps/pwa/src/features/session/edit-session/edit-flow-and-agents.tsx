import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { UniqueEntityID } from "@/shared/domain";

import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { CustomSheet } from "@/features/session/components/custom-sheet";
import { cn } from "@/shared/lib";
import {
  convertFlowAndAgentsFormToSessionProps,
  StepFlowAndAgents,
  StepFlowAndAgentsSchema,
  StepFlowAndAgentsSchemaType,
} from "@/features/session/create-session/step-flow-and-agents";
import { SvgIcon } from "@/components/ui/svg-icon";
import { Button } from "@/shared/ui/button";
import { CarouselItem } from "@/components-v2/ui/carousel";
import { SessionProps } from "@/modules/session/domain";
import { useQuery } from "@tanstack/react-query";
import { agentQueries } from "@/app/queries/agent/query-factory";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain/api-connection";

const AgentListItem = ({ agentId }: { agentId: UniqueEntityID }) => {
  const { data: agent } = useQuery(agentQueries.detail(agentId));

  if (!agent) {
    return null;
  }

  return (
    <CarouselItem className="basis-1/3 py-4 pl-4">
      <div
        className={cn(
          "flex flex-col gap-6 rounded-lg p-6",
          "bg-background-surface-3 outline-border-light outline-1",
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
    <CarouselItem className="basis-1/3 py-[24px] pl-[24px]">
      <div
        className={cn(
          "relative grid h-[164px] w-[280px] place-content-center rounded-[8px]",
          "bg-background-input",
        )}
      >
        <div className="text-background-dialog flex flex-col items-center gap-[16px]">
          <div className="text-[12px] leading-[15px] font-[500]">
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
          ...convertFlowAndAgentsFormToSessionProps(
            value as StepFlowAndAgentsSchemaType,
          ),
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
