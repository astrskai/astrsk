import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload, Copy, Trash2, CircleAlert, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { queryClient } from "@/shared/api/query-client";
import { SessionService } from "@/app/services/session-service";
import { sessionQueries } from "@/entities/session/api";
import { Session } from "@/entities/session/domain/session";
import { ModelTier } from "@/entities/agent/domain/agent";
import { FlowService } from "@/app/services/flow-service";
import { AgentService } from "@/app/services/agent-service";
import { useSessionStore } from "@/shared/stores/session-store";
import { useAsset } from "@/shared/hooks/use-asset";
import { useSessionValidation } from "@/shared/hooks/use-session-validation";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import {
  AgentModelTierInfo,
  SessionExportDialog,
} from "../dialog/session-export-dialog";
import { Checkbox, Label } from "@/shared/ui";
import { SessionPlaceholder } from "@/shared/assets/placeholders";
import { cn, downloadFile, logger } from "@/shared/lib";
import { UniqueEntityID } from "@/shared/domain";

interface SessionCardProps {
  session: Session;
}

/**
 * Session card component with custom design
 * Layout: 2/3 image at top, 1/3 content at bottom (title + message count)
 */
export function SessionCard({ session }: SessionCardProps) {
  const [isOpenCopyDialog, setIsOpenCopyDialog] = useState<boolean>(false);
  const [isIncludeChatHistory, setIsIncludeChatHistory] =
    useState<boolean>(false);
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState<boolean>(false);
  const [isOpenExportDialog, setIsOpenExportDialog] = useState<boolean>(false);
  const [exportAgents, setExportAgents] = useState<AgentModelTierInfo[]>([]);

  const navigate = useNavigate();
  const selectSession = useSessionStore.use.selectSession();

  const { isValid, isFetched } = useSessionValidation(session.id);
  const isInvalid = isFetched && !isValid;

  // Get session background image
  const backgroundId = session.props.backgroundId;
  const [coverImageUrl] = useAsset(backgroundId);

  const handleCardClick = () => {
    selectSession(session.id, session.props.title);
    navigate({
      to: "/sessions/$sessionId",
      params: { sessionId: session.id.toString() },
    });
  };

  const handleExportClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        if (!session || !session.flowId) {
          toast.error("No flow associated with this session");
          return;
        }

        // Get flow to find agents
        const flowQuery = await queryClient.fetchQuery({
          queryKey: ["flow", session.flowId.toString()],
          queryFn: async () => {
            const result = await FlowService.getFlow.execute(session.flowId!);
            if (result.isFailure) throw new Error(result.getError());
            return result.getValue();
          },
        });

        if (!flowQuery) {
          toast.error("Failed to load flow");
          return;
        }

        // Get agents for this flow
        const agents: AgentModelTierInfo[] = [];
        for (const node of flowQuery.props.nodes) {
          if (node.type === "agent") {
            const agentId = node.id;
            const agentQuery = await queryClient.fetchQuery({
              queryKey: ["agent", agentId],
              queryFn: async () => {
                const result = await AgentService.getAgent.execute(
                  new UniqueEntityID(agentId),
                );
                if (result.isFailure) throw new Error(result.getError());
                return result.getValue();
              },
            });

            if (agentQuery) {
              agents.push({
                agentId: agentId,
                agentName: agentQuery.props.name,
                modelName: agentQuery.props.modelName || "",
                recommendedTier: ModelTier.Light,
                selectedTier: agentQuery.props.modelTier || ModelTier.Light,
              });
            }
          }
        }

        setExportAgents(agents);
        setIsOpenExportDialog(true);
      } catch (error) {
        logger.error("Failed to prepare export:", error);
        toast.error("Failed to prepare export");
      }
    },
    [session],
  );

  const handleExport = useCallback(
    async (
      modelTierSelections: Map<string, ModelTier>,
      includeHistory: boolean,
    ) => {
      try {
        // Export session to file with model tier selections
        const fileOrError = await SessionService.exportSessionToFile.execute({
          sessionId: session.id,
          includeHistory,
          modelTierSelections,
        });

        if (fileOrError.isFailure) {
          throw new Error(fileOrError.getError());
        }

        const file = fileOrError.getValue();

        // Download session file
        downloadFile(file);
        toast.success("Session exported successfully");
        setIsOpenExportDialog(false);
      } catch (error) {
        logger.error(error);

        if (error instanceof Error) {
          toast.error("Failed to export session", {
            description: error.message,
          });
        }
      } finally {
        setIsOpenExportDialog(false);
      }
    },
    [session.id],
  );

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpenCopyDialog(true);
  };

  const handleCopy = useCallback(async () => {
    try {
      // Clone session
      const copiedSessionOrError = await SessionService.cloneSession.execute({
        sessionId: session.id,
        includeHistory: isIncludeChatHistory,
      });
      if (copiedSessionOrError.isFailure) {
        throw new Error(copiedSessionOrError.getError());
      }

      // Invalidate sessions list only (navigate 제거)
      queryClient.invalidateQueries({ queryKey: sessionQueries.lists() });

      // Success feedback
      toast.success("Session copied successfully");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to copy session", { description: error.message });
      }
    } finally {
      setIsOpenCopyDialog(false);
      setIsIncludeChatHistory(false);
    }
  }, [isIncludeChatHistory, session.id]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpenDeleteDialog(true);
  };

  const handleDelete = useCallback(async () => {
    try {
      // Delete session
      const deleteSessionOrError = await SessionService.deleteSession.execute(
        session.id,
      );
      if (deleteSessionOrError.isFailure) {
        throw new Error(deleteSessionOrError.getError());
      }

      // Invalidate sessions list only
      queryClient.invalidateQueries({ queryKey: sessionQueries.lists() });

      // Success feedback
      toast.success("Session deleted successfully");
    } catch (error) {
      logger.error(error);
      if (error instanceof Error) {
        toast.error("Failed to delete session", { description: error.message });
      }
    } finally {
      setIsOpenDeleteDialog(false);
    }
  }, [session.id]);

  const messageCount = session.props.turnIds.length;

  return (
    <>
      <div
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl",
          "border-border border bg-gray-900",
          "hover:border-primary/50 transition-all hover:shadow-lg",
          "flex h-[300px] max-w-[340px] flex-col",
        )}
        onClick={handleCardClick}
      >
        {/* Top 2/3: Cover Image */}
        <div className="bg-background-surface-2 relative h-[200px] w-full overflow-hidden">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={session.props.title || "Session cover"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <SessionPlaceholder
              className="text-text-secondary/20 h-full w-full"
              preserveAspectRatio="xMidYMid slice"
            />
          )}

          {/* Gradient overlay for better text readability */}
          <div className="from-background-surface-1/80 absolute inset-0 bg-gradient-to-t to-transparent" />

          {/* Action Buttons - Top Left (visible on hover) */}
          <div className="absolute top-3 left-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              onClick={handleExportClick}
              icon={<Upload size={16} />}
              size="sm"
              aria-label="Export session"
            />
            <Button
              onClick={handleCopyClick}
              icon={<Copy size={16} />}
              size="sm"
              aria-label="Copy session"
            />
            <Button
              onClick={handleDeleteClick}
              icon={<Trash2 size={16} />}
              size="sm"
              aria-label="Delete session"
            />
          </div>
        </div>

        {/* Bottom 1/3: Content (Left-aligned) */}
        <div className="flex flex-1 flex-col justify-between p-4">
          {/* Title */}
          <div className="flex items-start gap-1">
            <h3 className="text-text-primary group-hover:text-primary [display:-webkit-box] flex-1 overflow-hidden text-left text-base font-semibold text-ellipsis transition-colors [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {session.props.title || "Untitled Session"}
            </h3>
            {isInvalid && (
              <CircleAlert
                size={16}
                className="text-status-destructive-light mt-0.5 flex-shrink-0"
              />
            )}
          </div>

          {/* Message Count */}
          <div className="text-text-secondary mt-2 flex items-center gap-1 text-left text-sm">
            {messageCount === 0 ? (
              <span>No message</span>
            ) : (
              <>
                <MessageCircle size={16} className="mr-1 text-white" />
                <span className="text-text-primary font-medium">
                  {messageCount.toLocaleString()}
                </span>
                <span>{messageCount === 1 ? "Message" : "Messages"}</span>
              </>
            )}
          </div>
        </div>

        {/* Hover overlay border */}
        <div className="group-hover:border-primary/30 pointer-events-none absolute inset-0 rounded-2xl border-2 border-transparent transition-colors" />
      </div>

      {/* Dialogs - Outside of onClick area to prevent event bubbling */}
      <SessionExportDialog
        open={isOpenExportDialog}
        onOpenChange={setIsOpenExportDialog}
        agents={exportAgents}
        onExport={handleExport}
      />

      <ActionConfirm
        open={isOpenDeleteDialog}
        onOpenChange={setIsOpenDeleteDialog}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently delete the session and all its messages."
        confirmLabel="Yes, delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />

      <ActionConfirm
        open={isOpenCopyDialog}
        onOpenChange={setIsOpenCopyDialog}
        title="Copy session"
        description="Do you want to include chat history?"
        content={
          <Label className="flex flex-row items-center gap-2">
            <Checkbox
              checked={isIncludeChatHistory}
              onCheckedChange={(checked) => {
                setIsIncludeChatHistory(checked === true);
              }}
            />
            <span className="text-sm font-normal">
              Include chat messages in the duplicated session
            </span>
          </Label>
        }
        confirmLabel="Copy"
        onConfirm={handleCopy}
      />
    </>
  );
}
