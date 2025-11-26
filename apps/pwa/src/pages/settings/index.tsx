import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import {
  Separator,
  Typo2XLarge,
  TypoXLarge,
  TypoBase,
  SvgIcon,
} from "@/shared/ui";
import { ConvexReady } from "@/shared/ui/convex-ready";
import { Authenticated, Unauthenticated } from "convex/react";

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// Settings menu items configuration
interface SettingsMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  showChevron?: boolean;
}

interface SettingsSectionProps {
  title?: string;
  items: SettingsMenuItem[];
  className?: string;
}

// Reusable menu item component
const SettingsMenuItemComponent = ({
  label,
  onClick,
  icon,
  showChevron = true,
}: SettingsMenuItem) => {
  return (
    <div
      className="flex cursor-pointer items-center justify-between"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {icon}
        <TypoBase className="text-text-body font-semibold">{label}</TypoBase>
      </div>
      {showChevron && (
        <ChevronRight className="text-text-secondary h-5 min-h-4 w-5 min-w-4" />
      )}
    </div>
  );
};

// Reusable section component
const SettingsSectionComponent = ({
  title,
  items,
  className = "my-8 space-y-8 md:my-13",
}: SettingsSectionProps) => {
  return (
    <section className={className}>
      {title && (
        <TypoXLarge className="text-text-primary font-semibold">
          {title}
        </TypoXLarge>
      )}

      {items.map((item) => (
        <SettingsMenuItemComponent key={item.label} {...item} />
      ))}
    </section>
  );
};

export default function SettingsPage() {
  const navigate = useNavigate();

  // Settings menu configuration
  const appPreferencesItems: SettingsMenuItem[] = [
    {
      label: "Account and subscription",
      onClick: () => navigate({ to: "/settings/account" }),
      showChevron: true,
    },
    {
      label: "Providers",
      onClick: () => navigate({ to: "/settings/providers" }),
      showChevron: true,
    },
  ];

  const communityItems: SettingsMenuItem[] = [
    {
      label: "Join our Discord",
      onClick: () => openInNewTab("https://discord.gg/J6ry7w8YCF"),
      icon: <SvgIcon name="discord" className="h-5 w-5 text-[#5865F2]" />,
      showChevron: false,
    },
    {
      label: "Visit our Reddit",
      onClick: () => openInNewTab("https://www.reddit.com/r/astrsk_ai/"),
      icon: <SvgIcon name="reddit_color" className="h-5 w-5 text-orange-500" />,
      showChevron: false,
    },
  ];

  const supportItems: SettingsMenuItem[] = [
    {
      label: "User manual",
      onClick: () => openInNewTab("https://docs.astrsk.ai/"),
      showChevron: false,
    },
    {
      label: "About astrsk.ai",
      onClick: () => openInNewTab("https://about.astrsk.ai"),
      showChevron: false,
    },
    {
      label: "Legal",
      onClick: () => navigate({ to: "/settings/legal" }),
      showChevron: true,
    },
  ];

  const advancedItems: SettingsMenuItem[] = [
    {
      label: "Advanced Preferences",
      onClick: () => navigate({ to: "/settings/advanced" }),
      showChevron: true,
    },
  ];

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="text-text-primary p-4 text-2xl font-semibold">
          Settings
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-lg px-4 py-4 md:py-6 md:pt-20 md:pb-6">
            {/* Desktop title - hidden on mobile */}
            <Typo2XLarge className="text-text-primary mb-12 hidden font-semibold md:block">
              Settings
            </Typo2XLarge>

            {/* App Preferences Section */}
            <section className="mb-8 space-y-8 md:mb-12">
              <TypoXLarge className="text-text-primary font-semibold">
                App Preferences
              </TypoXLarge>

              <ConvexReady>
                <Authenticated>
                  {appPreferencesItems.map((item) => (
                    <SettingsMenuItemComponent key={item.label} {...item} />
                  ))}
                </Authenticated>
                <Unauthenticated>
                  <SettingsMenuItemComponent
                    label="Providers"
                    onClick={() => navigate({ to: "/settings/providers" })}
                    showChevron={true}
                  />
                </Unauthenticated>
              </ConvexReady>
            </section>

            <Separator />

            {/* Community Section */}
            <SettingsSectionComponent
              title="Community"
              items={communityItems}
            />

            <Separator />

            {/* Support Section */}
            <SettingsSectionComponent title="Support" items={supportItems} />

            <Separator />

            {/* Advanced Section */}
            <SettingsSectionComponent items={advancedItems} />
          </div>
        </div>
      </div>
    </>
  );
}
