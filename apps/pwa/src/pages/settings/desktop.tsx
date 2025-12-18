import { useState, useEffect } from "react";
import { Download, Monitor, ExternalLink, Loader2 } from "lucide-react";
import { IconApple, IconWindows } from "@/shared/assets/icons";
import { toastError } from "@/shared/ui/toast";

const GITHUB_RELEASES_BASE =
  "https://github.com/astrskai/astrsk/releases/download";
const GITHUB_API_LATEST =
  "https://api.github.com/repos/astrskai/astrsk/releases/latest";

interface ReleaseInfo {
  version: string;
  isCurrentVersion: boolean;
}

function getDownloadUrl(platform: "mac" | "windows", version: string) {
  if (platform === "mac") {
    return `${GITHUB_RELEASES_BASE}/v${version}/astrsk-${version}.dmg`;
  }

  return `${GITHUB_RELEASES_BASE}/v${version}/astrsk-${version}-x64.exe`;
}

function openInNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function fetchLatestRelease(): Promise<ReleaseInfo | null> {
  try {
    const response = await fetch(GITHUB_API_LATEST);

    if (!response.ok) {
      if (response.status === 403) {
        toastError("Rate limit exceeded. Please try again later.");
      } else {
        toastError("Failed to check for updates. Please try again.");
      }
      return null;
    }

    const data = await response.json();
    const version = data.tag_name?.replace("v", "") || null;

    if (!version) return null;

    return {
      version,
      isCurrentVersion: version === __APP_VERSION__,
    };
  } catch {
    toastError("Network error. Please check your connection.");
    return null;
  }
}

interface DownloadButtonProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  isLoading: boolean;
  disabled: boolean;
  onClick: () => void;
}

function DownloadButton({
  icon,
  label,
  description,
  isLoading,
  disabled,
  onClick,
}: DownloadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border-border-default bg-surface-raised hover:bg-surface-overlay active:bg-hover group flex w-full items-center justify-between rounded-2xl border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex items-center gap-4">
        <div className="border-border-default bg-surface text-fg-muted group-hover:border-border-muted group-hover:text-fg-default flex h-12 w-12 items-center justify-center rounded-xl border transition-colors">
          {icon}
        </div>
        <div className="text-left">
          <span className="text-fg-default text-sm font-medium">{label}</span>
          <p className="text-fg-subtle text-xs">{description}</p>
        </div>
      </div>
      <div className="text-fg-subtle group-hover:text-brand-500 transition-colors">
        {isLoading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Download size={20} />
        )}
      </div>
    </button>
  );
}

export default function DesktopAppPage() {
  const [loadingPlatform, setLoadingPlatform] = useState<
    "mac" | "windows" | null
  >(null);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkRelease() {
      setIsLoading(true);
      const release = await fetchLatestRelease();
      setReleaseInfo(release);
      setIsLoading(false);
    }

    checkRelease();
  }, []);

  const handleDownload = (platform: "mac" | "windows") => {
    if (!releaseInfo) {
      toastError("No release available. Please check back later.");
      return;
    }

    setLoadingPlatform(platform);
    window.location.href = getDownloadUrl(platform, releaseInfo.version);
    setTimeout(() => setLoadingPlatform(null), 1000);
  };

  const isDisabled = loadingPlatform !== null || isLoading || !releaseInfo;

  return (
    <div className="py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="bg-brand-500/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
          <Monitor size={32} className="text-brand-500" />
        </div>
        <h2 className="text-fg-default text-xl font-bold">
          Download Desktop App
        </h2>

        {isLoading ? (
          <p className="text-fg-subtle mt-1 text-xs">
            Checking available versions...
          </p>
        ) : releaseInfo ? (
          <div className="mt-1">
            <p className="text-fg-subtle text-xs">
              {releaseInfo.isCurrentVersion
                ? `Version ${releaseInfo.version}`
                : `Latest available: v${releaseInfo.version}`}
            </p>
            {!releaseInfo.isCurrentVersion && (
              <p className="text-status-warning mt-1 text-xs">
                v{__APP_VERSION__} is not yet released
              </p>
            )}
          </div>
        ) : (
          <p className="text-status-error mt-1 text-xs">
            No releases available
          </p>
        )}
      </div>

      {/* Download Buttons */}
      <div className="space-y-3">
        <DownloadButton
          icon={<IconApple className="h-6 w-6" />}
          label="Download for Mac"
          description=".dmg installer"
          isLoading={loadingPlatform === "mac" || isLoading}
          disabled={isDisabled}
          onClick={() => handleDownload("mac")}
        />
        <DownloadButton
          icon={<IconWindows className="h-6 w-6" />}
          label="Download for Windows"
          description=".exe installer (x64)"
          isLoading={loadingPlatform === "windows" || isLoading}
          disabled={isDisabled}
          onClick={() => handleDownload("windows")}
        />
      </div>

      {/* All Releases Link */}
      <div className="mt-6 text-center">
        <button
          onClick={() =>
            openInNewTab("https://github.com/astrskai/astrsk/releases")
          }
          className="text-fg-muted hover:text-fg-default inline-flex items-center gap-1.5 text-xs transition-colors"
        >
          <span>View all releases</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}
