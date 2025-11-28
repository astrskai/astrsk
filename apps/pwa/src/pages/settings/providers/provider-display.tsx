import { ComponentType, SVGProps, useCallback, useState } from "react";
import { Check, ChevronRight, Unlink } from "lucide-react";

import { FlowService } from "@/app/services/flow-service";
import { SessionService } from "@/app/services/session-service";

import { ApiSource, apiSourceLabel } from "@/entities/api/domain";
import { Flow } from "@/entities/flow/domain";
import { Session } from "@/entities/session/domain/session";

import {
  IconAIHorde,
  IconAnthropic,
  IconCohere,
  IconDeepSeek,
  IconGoogleAIStudio,
  IconKoboldCPP,
  IconLMStudio,
  IconMistral,
  IconOllama,
  IconOpenAI,
  IconOpenRouter,
  IconXAI,
} from "@/shared/assets/icons/providers";
import { UniqueEntityID } from "@/shared/domain";
import { cn } from "@/shared/lib";
import { DeleteConfirm, SvgIcon } from "@/shared/ui";

type ProviderIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ProviderLogoIcon = ({ Icon }: { Icon: ProviderIcon }) => (
  <Icon width={20} height={20} className="shrink-0" />
);

const apiSourceLogo = new Map<ApiSource, ProviderIcon | "astrsk_symbol">([
  [ApiSource.AstrskAi, "astrsk_symbol"],
  [ApiSource.OpenAI, IconOpenAI],
  [ApiSource.GoogleGenerativeAI, IconGoogleAIStudio],
  [ApiSource.Anthropic, IconAnthropic],
  [ApiSource.DeepSeek, IconDeepSeek],
  [ApiSource.Mistral, IconMistral],
  [ApiSource.xAI, IconXAI],
  [ApiSource.OpenRouter, IconOpenRouter],
  [ApiSource.Ollama, IconOllama],
  [ApiSource.KoboldCPP, IconKoboldCPP],
  [ApiSource.AIHorde, IconAIHorde],
  [ApiSource.Cohere, IconCohere],
  [ApiSource.LMStudio, IconLMStudio],
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

  // Get subtitle text
  const getSubtitle = () => {
    if (!isActive) {
      return "Not configured";
    }
    // Show first detail value (usually API key or Base URL)
    if (details && details.length > 0) {
      const firstDetail = details[0];
      // For OpenAI Compatible, show label to distinguish from API key
      if (apiSource === ApiSource.OpenAICompatible && firstDetail.label === "Base URL") {
        return `URL: ${firstDetail.value}`;
      }
      return firstDetail.value;
    }
    return "Connected";
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenEdit?.();
          }
        }}
        className={cn(
          "group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 text-left transition-all",
          "border-border-default bg-surface-raised",
          "hover:border-border-muted hover:bg-surface-overlay",
        )}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border bg-surface",
              "border-border-default",
              isActive ? "text-brand-400" : "text-fg-subtle",
            )}
          >
            {logo ? (
              logo === "astrsk_symbol" ? (
                <SvgIcon name="astrsk_symbol" size={20} />
              ) : (
                <ProviderLogoIcon Icon={logo} />
              )
            ) : (
              <span className="text-sm font-bold">
                {providerName.toString().charAt(0)}
              </span>
            )}
          </div>

          {/* Text */}
          <div className="min-w-0 text-left">
            <h4 className="text-sm font-semibold text-fg-default">
              {providerName}
            </h4>
            <p className="mt-0.5 max-w-[100px] truncate text-xs text-fg-muted">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Active badge */}
          {isActive && (
            <div className="flex items-center gap-1 rounded-full bg-brand-400/10 px-2 py-1 text-[10px] font-bold text-brand-400">
              <Check size={12} />
              Active
            </div>
          )}

          {/* Unlink button */}
          {isActive && !hideButton && apiSource !== ApiSource.AstrskAi && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpenDeleteConfirm(true);
              }}
              className="rounded-lg p-2 text-fg-subtle transition-colors hover:bg-surface-overlay hover:text-status-error"
              title="Disconnect"
            >
              <Unlink size={16} />
            </button>
          )}

          {/* Chevron for non-active */}
          {!isActive && (
            <ChevronRight
              size={16}
              className="text-fg-subtle transition-colors group-hover:text-fg-default"
            />
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
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
            <span className="text-brand-400">{usedSessions.length} sessions</span>
            {" and "}
            <span className="text-brand-400">{usedFlows.length} flows</span>.
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
  );
};

export { ProviderDisplay };
export type { ProviderDisplayDetailProps, ProviderDisplayProps };
