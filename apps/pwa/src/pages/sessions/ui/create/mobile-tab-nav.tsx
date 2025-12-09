import { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

/**
 * Tab configuration for mobile navigation
 */
export interface MobileTab<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  /** Optional badge content (e.g., count) */
  badge?: ReactNode;
}

interface MobileTabNavProps<T extends string> {
  /** Currently selected tab value */
  value: T;
  /** Tab change handler */
  onValueChange: (value: T) => void;
  /** Tab configurations */
  tabs: MobileTab<T>[];
}

/**
 * Reusable mobile tab navigation component
 * Used across session creation steps (Scenario, Cast, HUD)
 */
export function MobileTabNav<T extends string>({
  value,
  onValueChange,
  tabs,
}: MobileTabNavProps<T>) {
  return (
    <div className="z-20 flex-shrink-0 p-2 md:hidden">
      <Tabs value={value} onValueChange={(v) => onValueChange(v as T)}>
        <TabsList variant="dark-mobile" className="w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.icon}
              {tab.label}
              {tab.badge}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
