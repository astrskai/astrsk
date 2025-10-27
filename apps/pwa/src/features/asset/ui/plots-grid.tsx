import { Plus } from "lucide-react";
import { PlotCard } from "@/entities/card/domain/plot-card";
import CardDisplay from "@/features/card/ui/card-display";
import { NewPlotCard } from "./new-plot-card";
import { Button } from "@/shared/ui/forms";

interface PlotsGridProps {
  plots: PlotCard[];
  onCreatePlot: () => void;
  keyword: string;
}

/**
 * Plots grid component
 * Displays plot cards in a responsive grid with optional New Plot Card
 *
 * Layout:
 * - Mobile: Button above grid + 2 columns per row
 * - Desktop: New card inside grid + up to 5 columns per row
 */
export function PlotsGrid({
  plots,
  onCreatePlot,
  keyword,
}: PlotsGridProps) {
  const showNewPlotCard = !keyword;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mobile: Create Button (outside grid) */}
      {showNewPlotCard && (
        <Button
          onClick={onCreatePlot}
          icon={<Plus size={16} />}
          className="w-full md:hidden"
        >
          Create new plot
        </Button>
      )}

      {/* Plots Grid */}
      <div className="mx-auto grid w-full grid-cols-2 justify-center gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Desktop: New Plot Card (inside grid) */}
        {showNewPlotCard && (
          <NewPlotCard
            onClick={onCreatePlot}
            className="hidden md:flex"
          />
        )}

        {/* Existing Plots */}
        {plots.map((plot) => (
          <div key={plot.id.toString()} className="group">
            <CardDisplay
              card={plot}
              isSelected={false}
              showActions={false}
              onClick={() => {
                // TODO: Navigate to plot detail page
                console.log("Plot clicked:", plot.id.toString());
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
