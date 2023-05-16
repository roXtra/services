const dirTree = require("directory-tree");
const { execSync } = require("child_process");

// If renamed, adjust name in trigger_release_creation.yml
const processHubSDKVersion = "v9.66.0";

const childProcessStdioOptions = [0, 1, 2];
const childProcessTimeout = 300000;

const args = process.argv.slice(2);
const runMode = args[0];

let errorOccurred = false;

// Script Procedure
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

function buildService(directoryPath) {
  try {
    const childProcessOptions = {
      cwd: directoryPath,
      stdio: childProcessStdioOptions,
      timeout: childProcessTimeout,
    };

    // Install current processhub-sdk for child
    execSync(`npm i --save https://github.com/roXtra/processhub-sdk/releases/download/${processHubSDKVersion}/release.tgz`, childProcessOptions);
    console.log("Installed current processhub SDK for " + directoryPath);

    // npm install
    execSync("npm ci", childProcessOptions);
    console.log("Executed npm install for " + directoryPath);

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
    // npm pack
    execSync("npm pack", childProcessOptions);
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
