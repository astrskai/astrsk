import { useCallback, useState } from "react";
import { TextareaAutosize } from "@mui/material";
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/shared/lib";

interface ChatScenarioMessageProps {
  content: string;
  onEdit: (content: string) => Promise<void> | void;
  onDelete: () => void;
}

export default function ChatScenarioMessage({
  content,
  onEdit,
  onDelete,
}: ChatScenarioMessageProps) {
  const [editedContent, setEditedContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleEdit = () => {
    setEditedContent(content ?? "");
    setIsEditing(true);
  };

  const handleEditDone = useCallback(async () => {
    await onEdit(editedContent);
    setIsEditing(false);
  }, [editedContent, onEdit]);

  const handleEditCancel = useCallback(() => {
    setEditedContent("");
    setIsEditing(false);
  }, []);

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  return (
    <div className="group/scenario relative p-4">
      <div className="relative mx-auto max-w-full rounded-lg bg-gray-950/30 p-4 text-gray-200 backdrop-blur-xl md:max-w-4xl">
        {isEditing ? (
          <TextareaAutosize
            className={cn(
              "no-resizer w-full rounded-none border-0 bg-transparent p-0 outline-0",
              "ring-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0",
              "break-words",
            )}
            autoFocus
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEditDone();
              }
            }}
          />
        ) : (
          <Markdown
            className="markdown"
            remarkPlugins={[remarkBreaks]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {content}
          </Markdown>
        )}

        {/* Action buttons - shown on hover at top-right corner */}
        <div
          className={cn(
            "absolute top-2 right-2 z-10 hidden group-hover/scenario:flex",
          )}
        >
          <div className="flex items-center gap-1 rounded-lg bg-gray-500/30 px-2 py-1 text-gray-200">
            <button
              type="button"
              className="flex items-center justify-center p-1 hover:text-gray-200/70"
              aria-label="Edit"
              onClick={isEditing ? handleEditDone : handleEdit}
            >
              {isEditing ? (
                <Check className="h-5 w-5" />
              ) : (
                <Pencil className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              className="flex items-center justify-center p-1 hover:text-gray-200/70"
              aria-label={isEditing ? "Cancel" : "Delete"}
              onClick={isEditing ? handleEditCancel : handleDelete}
            >
              {isEditing ? (
                <X className="h-5 w-5" />
              ) : (
                <Trash2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
