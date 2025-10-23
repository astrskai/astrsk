import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components-v2/ui/dialog";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/components-v2/ui/scroll-area";
import { Badge } from "@/components-v2/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components-v2/ui/tabs";
import { Check, X, Code, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { ReviewData } from "../types";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewData: ReviewData | null;
  onApprove: () => void;
  onReject: () => void;
}

export const ReviewDialog: React.FC<ReviewDialogProps> = ({
  open,
  onOpenChange,
  reviewData,
  onApprove,
  onReject,
}) => {
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"changes" | "full">("changes");

  if (!reviewData) return null;

  const totalChanges = reviewData.appliedChanges.length;
  const currentChange = reviewData.appliedChanges[currentChangeIndex];

  const navigateChange = (direction: "prev" | "next") => {
    if (direction === "prev" && currentChangeIndex > 0) {
      setCurrentChangeIndex(currentChangeIndex - 1);
    } else if (direction === "next" && currentChangeIndex < totalChanges - 1) {
      setCurrentChangeIndex(currentChangeIndex + 1);
    }
  };

  const renderChangeDetails = (change: any) => {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            {change.operation === "set" && "✏️ Edit"}
            {change.operation === "put" && "➕ Add"}
            {change.operation === "remove" && "🗑️ Remove"}
          </Badge>
          <Badge variant="secondary">
            Confidence: {Math.round((change.confidence || 0) * 100)}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium">Path:</span>
            <code className="bg-muted ml-2 rounded px-1 py-0.5 text-xs">
              {change.path}
            </code>
          </div>

          {change.changeReason && (
            <div>
              <span className="text-sm font-medium">Reason:</span>
              <p className="text-muted-foreground mt-1 text-sm">
                {change.changeReason}
              </p>
            </div>
          )}

          {change.value !== undefined && (
            <div>
              <span className="text-sm font-medium">New Value:</span>
              <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 text-xs">
                {JSON.stringify(change.value, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFullComparison = () => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold">Original</h4>
          <ScrollArea className="h-[400px] rounded-lg border">
            <pre className="p-2 text-xs">
              {JSON.stringify(reviewData.original, null, 2)}
            </pre>
          </ScrollArea>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Modified</h4>
          <ScrollArea className="h-[400px] rounded-lg border">
            <pre className="p-2 text-xs">
              {JSON.stringify(reviewData.edited, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Review Changes</span>
            <Badge variant="outline">
              {totalChanges} change{totalChanges !== 1 && "s"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="changes">
              <Code className="mr-2 h-4 w-4" />
              Changes
            </TabsTrigger>
            <TabsTrigger value="full">
              <Eye className="mr-2 h-4 w-4" />
              Full Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="changes" className="space-y-4">
            {totalChanges > 1 && (
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateChange("prev")}
                  disabled={currentChangeIndex === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm">
                  Change {currentChangeIndex + 1} of {totalChanges}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigateChange("next")}
                  disabled={currentChangeIndex === totalChanges - 1}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}

            {currentChange && (
              <ScrollArea className="h-[400px] rounded-lg border p-4">
                {renderChangeDetails(currentChange)}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="full">{renderFullComparison()}</TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onReject();
              onOpenChange(false);
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Reject Changes
          </Button>
          <Button
            onClick={() => {
              onApprove();
              onOpenChange(false);
            }}
          >
            <Check className="mr-2 h-4 w-4" />
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
