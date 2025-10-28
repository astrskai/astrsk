/**
 * Extension Dialog Renderer
 *
 * Renders dialogs triggered by extensions using the global dialog store
 */

import { useExtensionDialogStore } from "./dialog-manager";
import { PlainDialog } from "@/components-v2/ui/plain-dialog";
import { Button } from "@/components-v2/ui/button";
import { ScrollArea } from "@/components-v2/ui/scroll-area";

/**
 * Render lorebook entry content
 */
function LorebookEntryContent({ data }: { data: any }) {
  const { entryName, content, keys } = data;

  return (
    <ScrollArea className="max-h-[400px] pr-4">
      <div className="space-y-4">
        {/* Entry Name */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Entry Name
          </div>
          <div className="text-base">
            {entryName}
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Content
          </div>
          <div className="text-base bg-muted/50 p-3 rounded-md">
            {content}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Keywords (auto-generated)
          </div>
          <div className="flex flex-wrap gap-2">
            {keys.map((key: string, i: number) => (
              <span
                key={i}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
              >
                {key}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

/**
 * Render dialog content based on type
 */
function DialogContent({ content }: { content: any }) {
  // Handle string content
  if (typeof content === "string") {
    return <div className="text-base">{content}</div>;
  }

  // Handle structured content with type
  if (content && typeof content === "object" && content.type) {
    switch (content.type) {
      case "lorebook-entry":
        return <LorebookEntryContent data={content.data} />;
      default:
        return <div className="text-base">Unknown content type: {content.type}</div>;
    }
  }

  // Handle React node
  return content;
}

export function ExtensionDialogRenderer() {
  const { isOpen, config, closeDialog } = useExtensionDialogStore();

  if (!config) return null;

  return (
    <PlainDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeDialog();
        }
      }}
      title={config.title}
      description={config.description}
      maxWidth={config.maxWidth}
      footer={
        <>
          {config.buttons.map((button) => (
            <Button
              key={button.value}
              variant={button.variant || "default"}
              onClick={() => closeDialog(button.value)}
            >
              {button.label}
            </Button>
          ))}
        </>
      }
    >
      <DialogContent content={config.content} />
    </PlainDialog>
  );
}
