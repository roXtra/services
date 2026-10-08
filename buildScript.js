import dirTree from "directory-tree";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "node:fs";

// If renamed, adjust name in trigger_release_creation.yml
const processHubSDKVersion = "v9.146.0-1";

const childProcessStdioOptions = [0, 1, 2];
const childProcessTimeout = 300000;

const args = process.argv.slice(2);
const runMode = args[0];

let errorOccurred = false;

// Script Procedure
doForEachService(installDeps);
doForEachService(buildService);
if (runMode === "bundle") {
  doForEachService(bundleService);
}

if (errorOccurred) {
  process.exit(1);
} else {
  process.exit(0);
}

// Functions
function doForEachService(func) {
  dirTree(
    "./",
    {
      exclude: [/node_modules/, /zipped_services/, /commontestfiles/, /resources/, /\.git/, /\.vscode/, /\.idea/],
    },
    null,
    (item, path, stats) => {
      if (errorOccurred) {
        // Abort building of further services
        return;
      }

      const pathString = item.path.toString();
      if (pathString.includes("/") || pathString.includes("\\")) {
        //console.log("Skipped path " + item.path);
      } else {
        console.log("Processing service " + pathString);
        const buildReturnCode = func(pathString);
        if (buildReturnCode !== 0) errorOccurred = true;
      }
    },
  );
}

function installDeps(directoryPath) {
  const childProcessOptions = {
    cwd: directoryPath,
    stdio: childProcessStdioOptions,
    timeout: childProcessTimeout,
  };

  // Install current processhub-sdk for child from the @roxtra GitHub Packages registry
  const sdkVersion = processHubSDKVersion.replace(/^v/, "");
  execSync(`npm i --save @roxtra/processhub-sdk@${sdkVersion}`, childProcessOptions);
  console.log("Installed current processhub SDK for " + directoryPath);

  // npm install
  execSync("npm ci", childProcessOptions);
  console.log("Executed npm install for " + directoryPath);

  return 0;
}

function buildService(directoryPath) {
  try {
    const childProcessOptions = {
      cwd: directoryPath,
      stdio: childProcessStdioOptions,
      timeout: childProcessTimeout,
    };

    // Lint
    execSync("npm run lint", childProcessOptions);
    console.log("Executed linter for " + directoryPath);

    // tsc
    execSync("npm run build", childProcessOptions);
    console.log("Executed tsc for " + directoryPath);

    // Run tests
    execSync("npm test", childProcessOptions);
    console.log("Executed npm tests (if present) for " + directoryPath);
  } catch (error) {
    console.log("Error occurred: " + error);
    console.log("stdout: " + error.stdout);
    console.log("stderr: " + error.stderr);
    return 1;
  }

  return 0;
}

function bundleService(directoryPath) {
  try {
    const childProcessOptions = {
      cwd: directoryPath,
      stdio: childProcessStdioOptions,
      timeout: childProcessTimeout,
    };
    // External consumers still install tarballs from a specific GitHub release.
    // So we preserve the existing tarball naming convention. Existing Release URLs keep the same format: 
    // .../v9.145.0-1/eformservice-ics-1.0.3.tgz.    
    const manifestPath = `${directoryPath}/package.json`;
    const originalManifest = readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(originalManifest);
    try {
      // npm pack takes the name/version from package.json; temporarily rewrite only
      // the name here. GitHub Packages uses @roxtra/eformservice-<name> and the repo
      // version instead, set separately by the release workflow during publication.
      manifest.name = manifest.name.replace("@roxtra/eformservice-", "@eformservice/");
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
      execSync("npm pack", childProcessOptions);
    } finally {
      // Restore the source manifest before ZIP creation, also if npm pack throws.
      writeFileSync(manifestPath, originalManifest);
    }
    console.log("Executed npm pack for " + directoryPath);

    // npm run copyandzip
    execSync("npm run copyandzip", childProcessOptions);
    console.log("Executed npm run copyandzip for " + directoryPath);
  } catch (error) {
    console.log("Error occurred: " + error);
    console.log("stdout: " + error.stdout);
    console.log("stderr: " + error.stderr);
    return 1;
  }

  return 0;
}
