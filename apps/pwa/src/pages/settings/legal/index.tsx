import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, FileText } from "lucide-react";
import { LEGAL_ROUTES } from "@/shared/config/settings-routes";

export default function LegalPage() {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <div className="rounded-2xl border border-border-default bg-surface-raised">
        {LEGAL_ROUTES.map((item, index) => (
          <button
            key={item.title}
            className={`group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-overlay ${
              index !== LEGAL_ROUTES.length - 1
                ? "border-b border-border-default"
                : ""
            } ${index === 0 ? "rounded-t-2xl" : ""} ${
              index === LEGAL_ROUTES.length - 1 ? "rounded-b-2xl" : ""
            }`}
            onClick={() => navigate({ to: item.path })}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-surface text-fg-muted transition-colors group-hover:border-border-muted group-hover:text-fg-default">
                <FileText size={18} />
              </div>
              <span className="text-sm font-medium text-fg-default">
                {item.title}
              </span>
            </div>
            <ChevronRight
              size={16}
              className="text-fg-subtle transition-colors group-hover:text-fg-default"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
