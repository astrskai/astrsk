import { useReactFlow, Panel } from "@xyflow/react";
import { useCallback } from "react";
import { Fullscreen, ZoomIn, ZoomOut } from "lucide-react";

export function CustomReactFlowControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = useCallback(() => {
    zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut();
  }, [zoomOut]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
    <Panel position="bottom-left">
      <div className="px-6 py-3 bg-hover rounded-full shadow-[0px_1px_12px_0px_rgba(117,117,117,1.00),0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-border-subtle inline-flex justify-start items-center gap-6">
        <button
          onClick={handleZoomIn}
          className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity group"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="min-w-4 min-h-4 text-fg-default stroke-2" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity group"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="min-w-4 min-h-4 text-fg-default stroke-2" />
        </button>
        <button
          onClick={handleFitView}
          className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity group"
          title="Fit view"
          aria-label="Fit view"
        >
          <Fullscreen className="min-w-4 min-h-4 text-fg-default stroke-2" />
        </button>
      </div>
    </Panel>
  );
}