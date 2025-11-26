import { useEffect, useState, useMemo } from "react";
import { Search, ExternalLink, ChevronRight, Package } from "lucide-react";
import DialogBase from "@/shared/ui/dialogs/base";
import { toastError } from "@/shared/ui/toast/base";

interface LicenseInfo {
  name: string;
  repository: string;
  copyright: string;
  licenses: string;
  licenseText: string;
}

interface LicenseEntry {
  nameWithVersion: string;
  info: LicenseInfo;
}

export default function OssNoticePage() {
  const [licenses, setLicenses] = useState<Record<string, LicenseInfo>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<LicenseEntry | null>(
    null,
  );

  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        const response = await fetch("/licenses.json");
        if (!response.ok) {
          toastError("Failed to load license information");
          return;
        }
        setLicenses(await response.json());
      } catch (error) {
        console.error("License fetch error:", error);
        toastError("Failed to load license information");
      }
    };
    fetchLicenses();
  }, []);

  const licenseEntries = useMemo(() => {
    return Object.entries(licenses).map(([nameWithVersion, info]) => ({
      nameWithVersion,
      info,
    }));
  }, [licenses]);

  const filteredLicenses = useMemo(() => {
    if (!searchQuery.trim()) return licenseEntries;

    const query = searchQuery.toLowerCase();
    return licenseEntries.filter(
      ({ nameWithVersion, info }) =>
        nameWithVersion.toLowerCase().includes(query) ||
        info.licenses.toLowerCase().includes(query),
    );
  }, [licenseEntries, searchQuery]);

  const totalCount = licenseEntries.length;
  const filteredCount = filteredLicenses.length;

  return (
    <div className="py-8">
      {/* Notice header */}
      <div className="mb-6 text-sm text-fg-muted">
        <p className="mb-2">
          This application is Copyright © astrsk.ai All rights reserved.
        </p>
        <p>
          Questions?{" "}
          <a
            href="https://discord.gg/wAKM6CEF"
            className="text-brand-400 hover:text-brand-500"
            target="_blank"
            rel="noopener noreferrer"
          >
            Contact us on Discord
          </a>
        </p>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        />
        <input
          type="text"
          placeholder="Search packages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-border-default bg-surface py-2.5 pl-9 pr-4 text-sm text-fg-default placeholder:text-fg-subtle focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
      </div>

      {/* Count display */}
      <div className="mb-4 text-xs text-fg-subtle">
        {searchQuery ? (
          <>
            Showing {filteredCount} of {totalCount} packages
          </>
        ) : (
          <>{totalCount} packages</>
        )}
      </div>

      {/* Licenses list */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-raised">
        {filteredLicenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-fg-muted">
            <Package size={32} className="opacity-50" />
            <p className="text-sm">No packages found</p>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {filteredLicenses.map(({ nameWithVersion, info }) => (
              <button
                key={nameWithVersion}
                onClick={() => setSelectedLicense({ nameWithVersion, info })}
                className="group flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-overlay"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg-default">
                    {nameWithVersion}
                  </div>
                  <div className="mt-0.5 text-xs text-fg-subtle">
                    {info.licenses}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="ml-2 shrink-0 text-fg-subtle transition-colors group-hover:text-fg-default"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* License detail dialog */}
      <DialogBase
        open={!!selectedLicense}
        onOpenChange={(open) => !open && setSelectedLicense(null)}
        title={selectedLicense?.nameWithVersion}
        content={
          <div className="space-y-4">
            {/* License type badge */}
            <div className="inline-block rounded-full bg-brand-400/20 px-3 py-1 text-xs font-medium text-brand-400">
              {selectedLicense?.info.licenses}
            </div>

            {/* Repository link */}
            {selectedLicense?.info.repository && (
              <div>
                <div className="mb-1 text-xs font-medium text-fg-subtle">
                  Repository
                </div>
                <a
                  href={selectedLicense.info.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-500"
                >
                  <span className="truncate">
                    {selectedLicense.info.repository}
                  </span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
            )}

            {/* Copyright */}
            {selectedLicense?.info.copyright && (
              <div>
                <div className="mb-1 text-xs font-medium text-fg-subtle">
                  Copyright
                </div>
                <p className="text-sm text-fg-muted">
                  {selectedLicense.info.copyright}
                </p>
              </div>
            )}

            {/* License text */}
            <div>
              <div className="mb-2 text-xs font-medium text-fg-subtle">
                License Text
              </div>
              <pre className="max-h-[300px] overflow-x-hidden overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border-default bg-surface p-3 text-xs text-fg-muted">
                {selectedLicense?.info.licenseText}
              </pre>
            </div>
          </div>
        }
      />
    </div>
  );
}
