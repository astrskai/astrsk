import { useEffect, useState } from "react";

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
    <div className="fixed inset-0 left-0 z-40 overflow-y-auto py-[80px]">
      <div className="max-w-[587px] mx-auto text-text-primary">
        {/* Header with back button */}
        <div className="flex items-center mb-4">
          <div className="flex items-center justify-center h-full">
            <h1 className="text-2xl font-semibold">
              Open-source Software Notice
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="pr-8">
          {/* Notice header */}
          <div className="text-text-placeholder text-base font-normal mb-6">
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
                <h3 className="font-semibold mb-1">{nameWithVersion}</h3>
                <h4 className="mb-1 text-sm text-text-placeholder">
                  <a
                    href={info.repository}
                    className="text-primary-strong hover:text-primary-strong/80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {info.repository}
                  </a>
                </h4>
                <h5 className="mb-2 text-sm text-text-placeholder">
                  {info.copyright}
                </h5>
                <details className="w-full">
                  <summary className="text-text-placeholder">
                    {info.licenses}
                  </summary>
                  <pre className="overflow-y-auto border-1 p-2 border-border-divider whitespace-pre-line">
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
