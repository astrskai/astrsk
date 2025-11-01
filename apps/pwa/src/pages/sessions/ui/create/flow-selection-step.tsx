import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, SearchInput } from "@/shared/ui/forms";
import { FlowCard } from "@/pages/assets/flows/ui/list";
import { flowQueries } from "@/app/queries/flow-queries";
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
  onFlowSelected: (flow: Flow) => void;
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-text-primary mb-2 text-xl font-semibold">
          1. Select Flow<span className="text-status-required">*</span>
        </h2>
        <p className="text-text-secondary text-sm">
          Choose a flow (a bundle of prompt preset and AI model) to use for your
          session.
        </p>
      </div>

      {/* Add Flow Card */}
      <div
        onClick={handleAddFlowClick}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl transition-all",
          "bg-background-surface-4 border-2 p-6",
          "hover:border-primary/50 hover:shadow-lg",
          selectedFlow ? "border-primary shadow-lg" : "border-border",
        )}
      >
        {selectedFlow ? (
          <>
            {/* Selected Flow Display */}
            <h3 className="text-text-primary mb-3 flex items-center gap-2 text-lg font-semibold">
              <IconFlow className="h-5 w-5" />
              {selectedFlow.props.name || "Untitled Flow"}
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary">Nodes:</span>
                <span className="text-text-primary font-medium">
                  {selectedFlow.props.nodes.length}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary">Agents:</span>
                <span className="text-text-primary font-medium">
                  {
                    selectedFlow.props.nodes.filter(
                      (node) => node.type === "agent",
                    ).length
                  }
                </span>
              </div>

              {/* DataStore Fields */}
              {selectedFlow.props.dataStoreSchema?.fields &&
                selectedFlow.props.dataStoreSchema.fields.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    <span className="text-text-secondary text-sm font-medium">
                      Session stats
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedFlow.props.dataStoreSchema.fields.map(
                        (field, index) => (
                          <span
                            key={index}
                            className="bg-background-surface-3 text-text-secondary rounded-md px-2 py-0.5 text-xs"
                          >
                            {field.name}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          </>
        ) : (
          <>
            {/* Add Flow Placeholder */}
            <div className="flex flex-col items-center justify-center py-8">
              <IconFlow className="text-text-secondary mb-3 h-12 w-12" />
              <h3 className="text-text-primary mb-2 text-lg font-semibold">
                Add Flow
              </h3>
              <p className="text-text-secondary text-sm">
                Click to select a flow
              </p>
            </div>
          </>
        )}
      </div>

      {/* Flow Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Flow</DialogTitle>
            <DialogDescription>
              Choose a flow to use for this session
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Search Input */}
            <SearchInput
              name="flow-search"
              placeholder="Search flows..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full max-w-md"
            />

            {/* Flow Cards Grid */}
            <div className="max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredFlows.map((flow: Flow) => (
                  <FlowCard
                    key={flow.id.toString()}
                    flow={flow}
                    isSelected={selectedFlowId === flow.id.toString()}
                    onClick={() => setSelectedFlowId(flow.id.toString())}
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
