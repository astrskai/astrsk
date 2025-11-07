import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button, SearchInput } from "@/shared/ui/forms";
import FlowPreview from "@/features/flow/ui/flow-preview";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import { Flow } from "@/entities/flow/domain/flow";
import { IconFlow } from "@/shared/assets/icons";
import { cn } from "@/shared/lib";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

interface FlowSelectionStepProps {
  selectedFlow: Flow | null;
  onFlowSelected: (flow: Flow | null) => void;
}

/**
 * Flow Selection Step
 * First step in create session wizard
 * Allows user to select a flow from available flows
 */
export function FlowSelectionStep({
  selectedFlow,
  onFlowSelected,
}: FlowSelectionStepProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const { data: flows } = useQuery(flowQueries.list());

  // Filter flows by search keyword
  const filteredFlows = useMemo(() => {
    if (!flows) return [];
    if (!searchKeyword.trim()) return flows;

    const keyword = searchKeyword.toLowerCase();
    return flows.filter((flow: Flow) =>
      flow.props.name?.toLowerCase().includes(keyword),
    );
  }, [flows, searchKeyword]);

  const handleAddFlowClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogAdd = () => {
    if (selectedFlowId && flows) {
      const flow = flows.find((f: Flow) => f.id.toString() === selectedFlowId);
      if (flow) {
        onFlowSelected(flow);
        setIsDialogOpen(false);
        setSearchKeyword("");
      }
    }
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
    setSearchKeyword("");
  };

  const handleRemoveFlow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFlowSelected(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          Select a Roleplay Workflow
          <span className="text-status-required">*</span>
        </h2>
        <p className="text-text-secondary text-sm">
          A workflow is a bundle of prompt presets and AI models that defines
          your roleplay progression.
        </p>
      </div>

      {/* Selected Flow Display */}
      <div className="flex flex-col gap-4">
        {selectedFlow ? (
          <div className="mx-auto w-full max-w-2xl">
            <FlowPreview
              title={selectedFlow.props.name || "Untitled Flow"}
              description={selectedFlow.props.description}
              nodeCount={selectedFlow.props.nodes.length}
              onClick={handleAddFlowClick}
              actions={[
                {
                  icon: Trash2,
                  label: `Remove ${selectedFlow.props.name || "flow"}`,
                  onClick: handleRemoveFlow,
                },
              ]}
              isShowActions={true}
            />
          </div>
        ) : (
          /* Empty State - Show Select Button Card */
          <div
            onClick={handleAddFlowClick}
            className={cn(
              "group relative cursor-pointer overflow-hidden rounded-lg transition-all",
              "bg-black-alternate border-1 border-gray-700 p-6",
              "hover:border-primary/50 hover:shadow-lg",
            )}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <IconFlow className="text-text-secondary mb-3 h-12 w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Add Flow
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select a flow
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flow Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex h-[90dvh] max-h-[90dvh] max-w-5xl flex-col gap-2 md:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Select Flow</DialogTitle>
            <DialogDescription>
              Choose a flow to use for this session
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-4 py-4">
            {/* Search Input */}
            <SearchInput
              name="flow-search"
              placeholder="Search flows..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full max-w-md flex-shrink-0"
            />

            {/* Flow Cards Grid */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredFlows.map((flow: Flow) => (
                  <FlowPreview
                    key={flow.id.toString()}
                    title={flow.props.name || "Untitled Flow"}
                    description={flow.props.description}
                    nodeCount={flow.props.nodes.length}
                    onClick={() => setSelectedFlowId(flow.id.toString())}
                    className={cn(
                      selectedFlowId === flow.id.toString() &&
                        "!border-primary shadow-lg",
                    )}
                  />
                ))}
              </div>

              {/* Empty State */}
              {filteredFlows.length === 0 && (
                <div className="text-text-secondary flex flex-col items-center justify-center py-12 text-center">
                  {searchKeyword ? (
                    <>
                      <p className="mb-2 text-lg">No flows found</p>
                      <p className="text-sm">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="mb-2 text-lg">No flows available</p>
                      <p className="text-sm">Create a flow first to continue</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleDialogCancel}>
              Cancel
            </Button>
            <Button onClick={handleDialogAdd} disabled={!selectedFlowId}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
