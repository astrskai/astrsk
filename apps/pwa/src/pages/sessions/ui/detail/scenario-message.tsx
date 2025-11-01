import { useCallback, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { SvgIcon } from "@/shared/ui";
import { cn } from "@/shared/lib";

interface ScenarioMessageProps {
  content?: string;
  onEdit?: (content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const ScenarioMessage = ({
  content,
  onEdit,
  onDelete,
}: ScenarioMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>(content ?? "");
  const onEditDone = useCallback(async () => {
    await onEdit?.(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  return (
    <div
      className={cn(
        "group/scenario",
        // Desktop: horizontal padding
        "px-[56px]",
        // Mobile: horizontal padding
        "max-md:px-[16px]",
      )}
    >
      <div
        className={cn(
          "relative mx-auto w-full rounded-[4px] p-[24px]",
          "bg-background-container text-text-placeholder text-[16px] leading-[19px] font-[400]",
          "transition-all duration-200 ease-in-out",
          "group-hover/scenario:inset-ring-text-primary group-hover/scenario:inset-ring-1",
          isEditing && "inset-ring-text-primary inset-ring-1",
          // Desktop: max width and min width
          "md:max-w-[890px] md:min-w-[400px]",
          // Mobile: no min width, flexible
          "max-md:max-w-full",
        )}
      >
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "no-resizer -mb-[4px] w-full rounded-none border-0 bg-transparent p-0 outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
              "break-words",
            )}
            autoFocus
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onEditDone();
              }
            }}
          />
        ) : (
          <Markdown
            className="markdown overflow-wrap-anywhere break-words"
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {content}
          </Markdown>
        )}
        {/* Desktop: Action buttons outside container on the right */}
        <div
          className={cn(
            "absolute top-0 right-[-45px] flex flex-col gap-2",
            // Mobile: hide desktop buttons
            "max-md:hidden",
          )}
        >
          <div
            className={cn(
              "cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
              "transition-all duration-200 ease-in-out",
              "opacity-0 group-hover/scenario:block group-hover/scenario:opacity-100",
              isEditing && "opacity-100",
            )}
            onClick={() => {
              if (isEditing) {
                onEditDone();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? (
              <Check size={20} />
            ) : (
              <SvgIcon name="edit" size={20} />
            )}
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-container text-text-input-subtitle",
              "hover:text-text-primary hover:inset-ring-text-primary hover:inset-ring-1",
              "transition-all duration-200 ease-in-out",
              "opacity-0 group-hover/scenario:block group-hover/scenario:opacity-100",
              isEditing && "opacity-100",
            )}
            onClick={() => {
              if (isEditing) {
                // Cancel editing and restore original content
                setEditedContent(content ?? "");
                setIsEditing(false);
              } else {
                onDelete?.();
              }
            }}
          >
            {isEditing ? <X size={20} /> : <Trash2 size={20} />}
          </div>
        </div>

        {/* Mobile: Action buttons inside container at bottom */}
        <div
          className={cn(
            "mt-4 flex justify-end gap-2",
            // Desktop: hide mobile buttons
            "md:hidden",
          )}
        >
          <div
            className={cn(
              "cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-surface-3 text-text-input-subtitle",
              "active:text-text-primary active:inset-ring-text-primary active:inset-ring-1",
              "transition-all duration-200 ease-in-out",
            )}
            onClick={() => {
              if (isEditing) {
                onEditDone();
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? (
              <Check size={20} />
            ) : (
              <SvgIcon name="edit" size={20} />
            )}
          </div>
          <div
            className={cn(
              "cursor-pointer rounded-[8px] p-[8px]",
              "bg-background-surface-3 text-text-input-subtitle",
              "active:text-text-primary active:inset-ring-text-primary active:inset-ring-1",
              "transition-all duration-200 ease-in-out",
            )}
            onClick={() => {
              if (isEditing) {
                // Cancel editing and restore original content
                setEditedContent(content ?? "");
                setIsEditing(false);
              } else {
                onDelete?.();
              }
            }}
          >
            {isEditing ? <X size={20} /> : <Trash2 size={20} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioMessage;
