import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { PlotCard } from "@/entities/card/domain/plot-card";
import CardDisplay from "@/features/card/ui/card-display";
import { NewPlotCard } from "./new-plot-card";
import { Button } from "@/shared/ui/forms";

interface PlotsGridProps {
  plots: PlotCard[];
  showNewPlotCard: boolean;
}

/**
 * Plots grid component
 * Displays plot cards in a responsive grid with optional New Plot Card
 *
 * Layout:
 * - Mobile: Button above grid + 2 columns per row
 * - Desktop: New card inside grid + up to 5 columns per row
 */
export function PlotsGrid({ plots, showNewPlotCard }: PlotsGridProps) {
  const navigate = useNavigate();

  const handleCreatePlot = () => {
    navigate({ to: "/assets/create/plot" });
  };

  const handlePlotClick = (plotId: string) => {
    navigate({ to: "/cards/$cardId", params: { cardId: plotId } });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Mobile: Create Button (outside grid) */}
      {showNewPlotCard && (
        <Button
          onClick={handleCreatePlot}
          icon={<Plus size={16} />}
          className="w-full md:hidden"
        >
          Create new plot
        </Button>
      )}

      {/* Plots Grid */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 justify-center gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {/* Desktop: New Plot Card (inside grid) */}
        {showNewPlotCard && (
          <NewPlotCard onClick={handleCreatePlot} className="hidden md:flex" />
        )}

        {/* Existing Plots */}
        {plots.map((plot) => (
          <div key={plot.id.toString()} className="group">
            <CardDisplay
              card={plot}
              isSelected={false}
              showActions={true}
              onClick={() => handlePlotClick(plot.id.toString())}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
