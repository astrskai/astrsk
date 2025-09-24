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
    <div className="h-full overflow-y-auto py-[80px]">
      <div className="text-text-primary mx-auto max-w-[587px]">
        {/* Header with back button */}
        <div className="mb-4 flex items-center">
          <div className="flex h-full items-center justify-center">
            <h1 className="text-2xl font-semibold">
              Open-source Software Notice
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="pr-8">
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
