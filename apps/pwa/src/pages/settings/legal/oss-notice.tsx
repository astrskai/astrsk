import { useEffect, useState, useMemo } from "react";
import { Search, ExternalLink, ChevronRight, Package } from "lucide-react";
import DialogBase from "@/shared/ui/dialogs/base";
import { toastError } from "@/shared/ui/toast";

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
      <div className="text-fg-muted mb-6 text-sm">
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
          className="text-fg-subtle absolute top-1/2 left-3 -translate-y-1/2"
        />
        <label htmlFor="package-search" className="sr-only">
          Search packages
        </label>
        <input
          id="package-search"
          type="text"
          placeholder="Search packages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-border-default bg-surface text-fg-default placeholder:text-fg-subtle focus:border-brand-400 focus:ring-brand-400 w-full rounded-xl border py-2.5 pr-4 pl-9 text-sm focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Count display */}
      <div className="text-fg-subtle mb-4 text-xs">
        {searchQuery ? (
          <>
            Showing {filteredCount} of {totalCount} packages
          </>
        ) : (
          <>{totalCount} packages</>
        )}
      </div>

      {/* Licenses list */}
      <div className="border-border-default bg-surface-raised overflow-hidden rounded-2xl border">
        {filteredLicenses.length === 0 ? (
          <div className="text-fg-muted flex flex-col items-center justify-center gap-2 py-12">
            <Package size={32} className="opacity-50" />
            <p className="text-sm">No packages found</p>
          </div>
        ) : (
          <div className="divide-border-default divide-y">
            {filteredLicenses.map(({ nameWithVersion, info }) => (
              <button
                key={nameWithVersion}
                onClick={() => setSelectedLicense({ nameWithVersion, info })}
                className="group hover:bg-surface-overlay flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-fg-default truncate text-sm font-medium">
                    {nameWithVersion}
                  </div>
                  <div className="text-fg-subtle mt-0.5 text-xs">
                    {info.licenses}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-fg-subtle group-hover:text-fg-default ml-2 shrink-0 transition-colors"
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
            <div className="bg-brand-400/20 text-brand-400 inline-block rounded-full px-3 py-1 text-xs font-medium">
              {selectedLicense?.info.licenses}
            </div>

            {/* Repository link */}
            {selectedLicense?.info.repository && (
              <div>
                <div className="text-fg-subtle mb-1 text-xs font-medium">
                  Repository
                </div>
                <a
                  href={selectedLicense.info.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-400 hover:text-brand-500 inline-flex items-center gap-1 text-sm"
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
                <div className="text-fg-subtle mb-1 text-xs font-medium">
                  Copyright
                </div>
                <p className="text-fg-muted text-sm">
                  {selectedLicense.info.copyright}
                </p>
              </div>
            )}

            {/* License text */}
            <div>
              <div className="text-fg-subtle mb-2 text-xs font-medium">
                License Text
              </div>
              <pre className="border-border-default bg-surface text-fg-muted max-h-[300px] overflow-x-hidden overflow-y-auto rounded-lg border p-3 text-xs break-words whitespace-pre-wrap">
                {selectedLicense?.info.licenseText}
              </pre>
            </div>
          </div>
        }
      />
    </div>
  );
}
