#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Problematic licenses for commercial use
const PROBLEMATIC_LICENSES = [
  "GPL",
  "GPL-2.0",
  "GPL-3.0",
  "GPL-2.0-only",
  "GPL-3.0-only",
  "GPL-2.0-or-later",
  "GPL-3.0-or-later",
  "LGPL",
  "LGPL-2.0",
  "LGPL-2.1",
  "LGPL-3.0",
  "LGPL-2.0-only",
  "LGPL-2.1-only",
  "LGPL-3.0-only",
  "AGPL",
  "AGPL-3.0",
  "AGPL-3.0-only",
  "AGPL-3.0-or-later",
  "CC-BY-NC",
  "CC-BY-NC-SA",
  "CC-BY-NC-ND",
  "SSPL",
  "SSPL-1.0",
  "Commons-Clause",
  "Elastic-2.0",
  "BUSL",
  "BUSL-1.1",
];

// Acceptable licenses for commercial use
const ACCEPTABLE_LICENSES = [
  "MIT",
  "MIT*",
  "Apache",
  "Apache-2.0",
  "Apache-2.0 WITH LLVM-exception",
  "BSD",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BSD-4-Clause",
  "ISC",
  "0BSD",
  "CC0",
  "CC0-1.0",
  "CC-BY",
  "CC-BY-3.0",
  "CC-BY-4.0",
  "Unlicense",
  "Python-2.0",
  "BlueOak-1.0.0",
  "Artistic-2.0",
  "Zlib",
  "WTFPL",
  "MPL-2.0", // Mozilla Public License 2.0 is generally okay for commercial use
];

function checkLicenses() {
  const licensesPath = path.join(__dirname, "..", "THIRD-PARTY-NOTICES.txt");

  if (!fs.existsSync(licensesPath)) {
    console.error(
      '❌ License file not found. Run "npm run build" first to generate THIRD-PARTY-NOTICES.txt',
    );
    process.exit(1);
  }

  // For checking, we still need structured data, so let's use the rollup plugin's internal data
  // We'll parse the text file to extract the necessary information
  const fileContent = fs.readFileSync(licensesPath, "utf8");
  const licenses = [];

  // Parse the text file to extract package information
  const packageBlocks = fileContent.split(
    "--------------------------------------------------------------------------------",
  );

  packageBlocks.forEach((block) => {
    const packageMatch = block.match(/Package: (.+)/);
    const versionMatch = block.match(/Version: (.+)/);
    const licenseMatch = block.match(/License: (.+)/);

    if (packageMatch && versionMatch && licenseMatch) {
      licenses.push({
        name: packageMatch[1],
        version: versionMatch[1],
        license: licenseMatch[1],
      });
    }
  });
  const problematicPackages = [];
  const unknownLicenses = [];

  licenses.forEach((pkg) => {
    const licenseStr = (pkg.license || "Unknown").toUpperCase();

    // Check if it's a dual/multi license with an acceptable option
    const isDualLicenseWithSafeOption =
      licenseStr.includes(" OR ") &&
      ACCEPTABLE_LICENSES.some((safeLicense) =>
        licenseStr.includes(safeLicense.toUpperCase()),
      );

    // Check for problematic licenses
    const isProblematic =
      PROBLEMATIC_LICENSES.some((problemLicense) =>
        licenseStr.includes(problemLicense.toUpperCase()),
      ) && !isDualLicenseWithSafeOption;

    if (isProblematic) {
      problematicPackages.push({
        name: pkg.name,
        version: pkg.version,
        license: pkg.license,
      });
    }

    // Check for unknown or unrecognized licenses
    const isAcceptable = ACCEPTABLE_LICENSES.some((acceptableLicense) =>
      licenseStr.includes(acceptableLicense.toUpperCase()),
    );

    if (!isAcceptable && !isProblematic && pkg.license !== "Unknown") {
      unknownLicenses.push({
        name: pkg.name,
        version: pkg.version,
        license: pkg.license,
      });
    }
  });

  // Report results
  console.log("\n📋 License Check Report");
  console.log("=======================\n");

  if (problematicPackages.length > 0) {
    console.error(
      "❌ Found packages with problematic licenses for commercial use:\n",
    );
    problematicPackages.forEach((pkg) => {
      console.error(`  - ${pkg.name}@${pkg.version}: ${pkg.license}`);
    });
    console.error(
      "\n⚠️  These licenses may restrict commercial use or require source code disclosure.",
    );
    console.error("Please review and consider alternatives.\n");
  } else {
    console.log("✅ No problematic licenses found.\n");
  }

  if (unknownLicenses.length > 0) {
    console.warn("⚠️  Found packages with unrecognized licenses:\n");
    unknownLicenses.forEach((pkg) => {
      console.warn(`  - ${pkg.name}@${pkg.version}: ${pkg.license}`);
    });
    console.warn(
      "\n📝 Please manually review these licenses for commercial compatibility.\n",
    );
  }

  // Summary
  console.log("📊 Summary:");
  console.log(`  Total packages: ${licenses.length}`);
  console.log(`  Problematic licenses: ${problematicPackages.length}`);
  console.log(`  Unknown licenses: ${unknownLicenses.length}`);
  console.log(
    `  Verified safe: ${licenses.length - problematicPackages.length - unknownLicenses.length}\n`,
  );

  // Exit with error if problematic licenses found
  if (problematicPackages.length > 0) {
    process.exit(1);
  }
}

// Run the check
checkLicenses();
