import { useEffect, useState } from "react";
import { TypoXLarge } from "@/shared/ui";

interface LicenseInfo {
  name: string;
  repository: string;
  copyright: string;
  licenses: string;
  licenseText: string;
}

const OssNotice = () => {
  // Fetch licenses
  const [licenses, setLicenses] = useState<Record<string, LicenseInfo>>({});
  useEffect(() => {
    const fetchLicenses = async () => {
      const response = await fetch("/licenses.json");
      if (!response.ok) {
        throw new Error("Failed to fetch licenses.json");
      }
      setLicenses(await response.json());
    };
    fetchLicenses();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Content */}
      <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Open-source Software Notice
          </TypoXLarge>
          {/* Notice header */}
          <div className="text-text-placeholder mb-6 text-base font-normal">
            <p className="mb-6">
              This application is Copyright © astrsk.ai All right reserved.
            </p>
            <p className="mb-6">
              The following sets forth attribution notices for third party
              software that may be contained in this application.
            </p>
            <p className="mb-6">
              If you have any questions about these notices, please{" "}
              <a
                href="https://discord.gg/wAKM6CEF"
                className="text-primary-strong hover:text-primary-strong/80"
                target="_blank"
                rel="noopener noreferrer"
              >
                visit our discord server
              </a>{" "}
              and reach out to one of the members of our development team about
              your inquiries.
            </p>
          </div>
          <hr className="border-border-divider mb-6" />

          {/* Licenses content */}
          <div className="text-text-primary prose prose-invert max-w-none">
            {Object.entries(licenses).map(([nameWithVersion, info]) => (
              <div key={nameWithVersion} className="w-full">
                <h3 className="mb-1 font-semibold">{nameWithVersion}</h3>
                <h4 className="text-text-placeholder mb-1 text-sm">
                  <a
                    href={info.repository}
                    className="text-primary-strong hover:text-primary-strong/80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {info.repository}
                  </a>
                </h4>
                <h5 className="text-text-placeholder mb-2 text-sm">
                  {info.copyright}
                </h5>
                <details className="w-full">
                  <summary className="text-text-placeholder">
                    {info.licenses}
                  </summary>
                  <pre className="border-border-divider overflow-y-auto border-1 p-2 whitespace-pre-line">
                    {info.licenseText}
                  </pre>
                </details>
                <hr className="border-border-divider my-6" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OssNotice;
