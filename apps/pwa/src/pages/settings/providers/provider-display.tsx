import { useCallback, useState } from "react";
import { Pencil, Unlink } from "lucide-react";

import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";

import { ApiSource, apiSourceLabel } from "@/entities/api/domain";
import { Flow } from "@/entities/flow/domain";
import { Session } from "@/entities/session/domain/session";

import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import {
  Card,
  CardContent,
  DeleteConfirm,
  IconName,
  SvgIcon,
  TypoSmall,
  TypoTiny,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui";

const apiSourceLogo = new Map<ApiSource, IconName>([
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

interface ProviderDisplayDetailProps {
  label: string;
  value: string;
}

interface ProviderDisplayProps {
  apiSource: ApiSource;
  details?: ProviderDisplayDetailProps[];
  isActive?: boolean;
  onOpenEdit?: () => void;
  onDisconnect?: (usedResourceIds: {
    flowIds: UniqueEntityID[];
    sessionIds: UniqueEntityID[];
  }) => void;
  hideButton?: boolean;
}

const ProviderDisplay = ({
  apiSource,
  details,
  isActive,
  onOpenEdit,
  onDisconnect,
  hideButton = false,
}: ProviderDisplayProps) => {
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
        "group/card relative w-full shrink-0 cursor-pointer overflow-hidden rounded-lg md:h-[186px] md:w-[335px]",
        "bg-background-surface-3 border-border-light",
        apiSource === ApiSource.AstrskAi &&
          "bg-button-foreground-primary border-primary-semi-dark",
      )}
    >
      {isActive ? (
        <CardContent className="flex h-full flex-row p-0" onClick={onOpenEdit}>
          <div className="flex grow flex-col justify-start gap-4 px-4 py-6 md:justify-between min-w-0">
            <div className="flex h-[52px] flex-row items-center">
              {logo && <SvgIcon name={logo} size={40} />}
              <div className="text-text-primary text-[24px] leading-[29px] font-[600]">
                {apiSource === ApiSource.AstrskAi ? (
                  <SvgIcon
                    name="astrsk_logo_typo"
                    width={63.24}
                    height={17.8}
                  />
                ) : (
                  providerName
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 min-w-0">
              {details?.map((detail) => (
                <div key={detail.label} className="flex flex-col gap-1 min-w-0">
                  <TypoTiny className="text-text-subtle">
                    {detail.label}
                  </TypoTiny>
                  <TypoSmall className="text-text-primary truncate">
                    {detail.value}
                  </TypoSmall>
                </div>
              ))}
              {apiSource === ApiSource.AstrskAi && (
                <div className="text-text-input-subtitle text-[12px] leading-[15.6px] font-[600]">
                  <span className="text-text-muted-title">
                    Free Gemini 2.5 Flash & GPT-5 mini
                  </span>
                  <br />
                  for a limited period!
                </div>
              )}
            </div>
          </div>
          <div
            className={cn(
              "bg-background-surface-2 min-w-[40px]",
              "flex flex-col space-y-3 px-2 py-4",
              apiSource === ApiSource.AstrskAi && "bg-primary-dark",
            )}
          >
            {!hideButton && apiSource !== ApiSource.AstrskAi && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Pencil
                      size={12}
                      className="text-text-subtle h-5 w-5 cursor-pointer"
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Unlink
                      size={12}
                      className="text-text-subtle h-5 w-5"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpenDeleteConfirm(true);
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent variant="button">
                    <p>Unlink</p>
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
                />
              </>
            )}
          </div>
        </CardContent>
      ) : (
        <CardContent
          className="flex h-full items-start justify-start p-6 md:grid md:place-content-center md:p-0"
          onClick={onOpenEdit}
        >
          <div className="flex flex-row items-center gap-1">
            {logo && <SvgIcon name={logo} size={52} className="self-start" />}
            <div className="text-text-primary text-[32px] leading-[39px] font-[600]">
              {providerNameWithNewLine}
            </div>
          </div>
        </CardContent>
      )}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[8px]",
          "inset-ring-primary-normal inset-ring-2",
          "hidden group-hover/card:block",
        )}
      />
    </Card>
  );
};

export { ProviderDisplay };
export type { ProviderDisplayDetailProps, ProviderDisplayProps };
