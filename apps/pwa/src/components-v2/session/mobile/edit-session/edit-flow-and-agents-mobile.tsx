import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { UniqueEntityID } from "@/shared/domain";

import { useFlow } from "@/app/hooks/use-flow";
import { useFlowValidation } from "@/app/hooks/use-flow-validation";
import { useFlows } from "@/app/hooks/use-flows";
import { agentQueries } from "@/app/queries/agent-queries";
import { SessionService } from "@/app/services/session-service";
import { Combobox } from "@/components-v2/combobox";
import { cn } from "@/components-v2/lib/utils";
import {
  convertFlowAndAgentsFormToSessionProps,
  StepFlowAndAgentsSchema,
  StepFlowAndAgentsSchemaType,
} from "@/components-v2/session/mobile/create-session/step-flow-and-agents-mobile";
import { TopNavigation } from "@/components-v2/top-navigation";
import { Button } from "@/components-v2/ui/button";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain/api-connection";
import { Session, SessionProps } from "@/modules/session/domain";
import { useQuery } from "@tanstack/react-query";

const AgentListItem = ({ agentId }: { agentId: UniqueEntityID }) => {
  const { data: agent } = useQuery(agentQueries.detail(agentId));

  if (!agent) {
    return null;
  }

  return (
    <div
      className={cn("p-[24px] rounded-[4px] border", "border-border-container")}
    >
      <div className="space-y-[24px]">
        <div className="flex flex-row gap-[24px]">
          <p className="text-base font-medium text-text-primary">Agent</p>
          <p className="text-base font-normal text-text-secondary truncate">
            {agent.props.name || "Generate response"}
          </p>
        </div>
        <div className="flex flex-row gap-[24px]">
          <p className="text-base font-medium text-text-primary">Model</p>
          <p className="text-base font-normal text-text-secondary truncate">
            {`${apiSourceLabel.get((agent.props.apiSource as ApiSource) ?? "openai")} - ${agent.props.modelName}`}
          </p>
        </div>
      </div>
    </div>
  );
};

interface EditFlowAndAgentsMobileProps {
  session: Session;
  onSave: (props: Partial<SessionProps>) => Promise<void>;
  onBack: () => void;
}

export function EditFlowAndAgentsMobile({
  session,
  onSave,
  onBack,
}: EditFlowAndAgentsMobileProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { data: flows } = useFlows({});

  // Handle Android back gesture
  // useBackGesture({ onBack });

  // Use form
  const methods = useForm<StepFlowAndAgentsSchemaType>({
    resolver: zodResolver(StepFlowAndAgentsSchema),
    defaultValues: {
      flowId: session.props.flowId?.toString() || "",
    },
  });

  const flowId = methods.watch("flowId");
  const { data: selectedFlow } = useFlow(
    flowId ? new UniqueEntityID(flowId) : undefined,
  );
  const { isValid } = useFlowValidation(
    flowId ? new UniqueEntityID(flowId) : null,
  );

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const formValues = methods.getValues();
      const sessionProps = convertFlowAndAgentsFormToSessionProps(formValues);

      await onSave(sessionProps);
      toast.success("Flow & agents updated");
      onBack();
    } catch (error) {
      // Error handling is done in updateSession
    } finally {
      setIsSaving(false);
    }
  }, [methods, onSave]);

  return (
    <FormProvider {...methods}>
      <div className="fixed inset-0 z-50 bg-background-surface-2">
        {/* Header */}
        <TopNavigation
          title="Flow & Agent"
          leftAction={
            <Button
              variant="ghost_white"
              size="icon"
              onClick={onBack}
              className="h-[40px] w-[40px] p-[8px]"
            >
              <ChevronLeft className="min-h-6 min-w-6" />
            </Button>
          }
          rightAction={
            <Button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              variant="ghost"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          }
        />

        {/* Content */}
        <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
          <div className="px-[16px] py-[24px]">
            {/* Flow selection */}
            <div className="space-y-[40px]">
              <div>
                <h3 className="text-xl font-semibold pb-[8px]">Flow</h3>
                <p className="text-base text-text-input-subtitle mb-[24px]">
                  Choose a flow (a bundle of prompt preset and AI model) to use
                  for your session.
                </p>

                <Controller
                  control={methods.control}
                  name="flowId"
                  render={({ field: { onChange, value } }) => (
                    <Combobox
                      label="Flow"
                      triggerPlaceholder="Select a flow"
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
                    />
                  )}
                />
              </div>

              {/* Agents list */}
              {selectedFlow && selectedFlow.agentIds.length > 0 && (
                <div>
                  <h3 className="text-xl font-medium mb-[8px]">Agents</h3>
                  <p className="text-base text-text-input-subtitle mb-[24px]">
                    Listed below are the agents that make up this flow.
                  </p>

                  <div className="space-y-[24px]">
                    {selectedFlow.agentIds.map((agentId) => (
                      <AgentListItem
                        key={agentId.toString()}
                        agentId={agentId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
