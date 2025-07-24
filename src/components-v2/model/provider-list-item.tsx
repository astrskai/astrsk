"use client";

import { Pencil, Unlink } from "lucide-react";
import { useCallback, useState } from "react";

import { UniqueEntityID } from "@/shared/domain";

import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";
import { DeleteConfirm } from "@/components-v2/confirm";
import { cn } from "@/components-v2/lib/utils";
import { IconName, SvgIcon } from "@/components-v2/svg-icon";
import { TypoSmall, TypoTiny } from "@/components-v2/typo";
import { Card, CardContent } from "@/components-v2/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { ApiSource, apiSourceLabel } from "@/modules/api/domain";
import { Flow } from "@/modules/flow/domain";
import { Session } from "@/modules/session/domain/session";

export const apiSourceLogo = new Map<ApiSource, IconName>([
  [ApiSource.AstrskAi, "astrsk_symbol"],
  [ApiSource.OpenAI, "openai_logo"],
  [ApiSource.GoogleGenerativeAI, "google_ai_studio_logo"],
  [ApiSource.Anthropic, "anthropic_logo"],
  [ApiSource.DeepSeek, "deepseek_logo"],
  [ApiSource.Mistral, "mistral_logo"],
  [ApiSource.xAI, "xai_logo"],
  [ApiSource.OpenRouter, "openrouter_logo"],
  [ApiSource.Ollama, "ollama_logo"],
  [ApiSource.KoboldCPP, "koboldcpp_logo"],
  [ApiSource.AIHorde, "aihorde_logo"],
  [ApiSource.Cohere, "cohere_logo"],
]);

const apiSourceLabelWithNewLine = new Map<ApiSource, React.ReactNode>([
  [
    ApiSource.GoogleGenerativeAI,
    <>
      Google AI
      <br />
      Studio
    </>,
  ],
  [
    ApiSource.OpenAICompatible,
    <>
      OpenAI
      <br />
      Compatible
    </>,
  ],
]);

interface ProviderListItemDetail {
  label: string;
  value: string;
}

const ProviderListItem = ({
  apiSource,
  details,
  isActive,
  onOpenEdit,
  onDisconnect,
  hideButton = false,
}: {
  apiSource: ApiSource;
  details?: ProviderListItemDetail[];
  isActive?: boolean;
  onOpenEdit?: () => void;
  onDisconnect?: (usedResourceIds: {
    flowIds: UniqueEntityID[];
    sessionIds: UniqueEntityID[];
  }) => void;
  hideButton?: boolean;
}) => {
  const providerName = apiSourceLabel.get(apiSource) ?? apiSource;
  const providerNameWithNewLine =
    apiSourceLabelWithNewLine.get(apiSource) ??
    apiSourceLabel.get(apiSource) ??
    apiSource;
  const logo = apiSourceLogo.get(apiSource);

  // Delete confirm
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false);
  const [usedFlows, setUsedFlows] = useState<Flow[]>([]);
  const [usedSessions, setUsedSessions] = useState<Session[]>([]);
  const getUsedFlowsAndSessions = useCallback(async () => {
    // Get used flows
    let flows: Flow[] = [];
    const flowsOrError = await FlowService.listFlowByProvider.execute({
      provider: apiSource,
    });
    if (flowsOrError.isFailure) {
      return;
    }
    flows = flowsOrError.getValue();
    setUsedFlows(flows);

    // Get used sessions
    const sessions: Session[] = [];
    for (const flow of flows) {
      const sessionsOrError = await SessionService.listSessionByFlow.execute({
        flowId: flow.id,
      });
      if (sessionsOrError.isFailure) {
        continue;
      }
      sessions.push(...sessionsOrError.getValue());
    }
    setUsedSessions(sessions);
  }, [apiSource]);

  return (
    <Card
      className={cn(
        "group/card inline-block mr-[16px] mb-[calc(-6px+16px)] relative w-[335px] h-[186px] shrink-0 rounded-[8px] overflow-hidden cursor-pointer",
        "bg-background-surface-3 border-border-light",
        apiSource === ApiSource.AstrskAi &&
          "bg-button-foreground-primary border-primary-semi-dark",
      )}
    >
      {isActive ? (
        <CardContent className="h-full p-0 flex flex-row" onClick={onOpenEdit}>
          <div className="grow px-4 py-6 flex flex-col gap-4 justify-between">
            <div className="h-[52px] flex flex-row items-center">
              {logo && <SvgIcon name={logo} size={40} />}
              <div className="font-[600] text-[24px] leading-[29px] text-text-primary">
                {apiSource === ApiSource.AstrskAi ? <SvgIcon name="astrsk_logo_typo" width={63.24} height={17.8} /> : providerName}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {details?.map((detail) => (
                <div key={detail.label} className="flex flex-col gap-1">
                  <TypoTiny className="text-text-subtle">
                    {detail.label}
                  </TypoTiny>
                  <TypoSmall className="text-text-primary">
                    {detail.value}
                  </TypoSmall>
                </div>
              ))}
              {apiSource === ApiSource.AstrskAi && (
                <div className="font-[600] text-[12px] leading-[15.6px] text-text-input-subtitle">
                  To mark our v1.0 release,
                  <br />
                  <span className="text-text-muted-title">
                    Gemini 2.5 Flash is on the house
                  </span>
                  <br />
                  for all users for a limited period!
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              "min-w-[40px] bg-background-surface-2",
              "flex flex-col space-y-3 py-4 px-2",
              apiSource === ApiSource.AstrskAi && "bg-primary-dark",
            )}
          >
            {!hideButton && apiSource !== ApiSource.AstrskAi && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pencil
                      size={12}
                      className="text-text-subtle w-5 h-5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit?.();
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent variant="button">
                    <p>Edit</p>
                  </TooltipContent>
                </Tooltip>
                <DeleteConfirm
                  open={isOpenDeleteConfirm}
                  onOpenChange={async (open) => {
                    if (open) {
                      await getUsedFlowsAndSessions();
                    }
                    setIsOpenDeleteConfirm(open);
                  }}
                  description={
                    <>
                      This provider powers response generation for{" "}
                      <span className="text-secondary-normal">
                        {usedSessions.length} sessions
                      </span>
                      {" and "}
                      <span className="text-secondary-normal">
                        {usedFlows.length} flows
                      </span>
                      .
                      <br />
                      Disconnection will leave these without an AI model.
                    </>
                  }
                  deleteLabel="Yes, disconnect"
                  onDelete={(e) => {
                    e.stopPropagation();
                    onDisconnect?.({
                      flowIds: usedFlows.map((flow) => flow.id),
                      sessionIds: usedSessions.map((session) => session.id),
                    });
                  }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Unlink
                        size={12}
                        className="text-text-subtle w-5 h-5"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent variant="button">
                      <p>Unlink</p>
                    </TooltipContent>
                  </Tooltip>
                </DeleteConfirm>
              </>
            )}
          </div>
        </CardContent>
      ) : (
        <CardContent
          className="h-full p-0 grid place-content-center"
          onClick={onOpenEdit}
        >
          <div className="flex flex-row gap-[4px] items-center">
            {logo && <SvgIcon name={logo} size={52} className="self-start" />}
            <div className="font-[600] text-[32px] leading-[39px] text-text-primary">
              {providerNameWithNewLine}
            </div>
          </div>
        </CardContent>
      )}
      <div
        className={cn(
          "absolute inset-0 rounded-[8px] pointer-events-none",
          "inset-ring-2 inset-ring-primary-normal",
          "hidden group-hover/card:block",
        )}
      />
    </Card>
  );
};

export { ProviderListItem };
export type { ProviderListItemDetail };
