const dirTree = require('directory-tree');
const { execSync } = require('child_process');

const processHubSDKVersion = 'v8.21.0-3';
// Put in the react version that is also used in the SDK
const processHubSDKVersion_React = '16.9.0'
  // Put in the @types/react version that is also used in the SDK
const processHubSDKVersion_ReactTypes = '16.9.15'

const childProcessStdioOptions = [0, 1, 2];
const childProcessTimeout = 300000;

const args = process.argv.slice(2);
const runMode = args[0];

let errorOccurred = false;

const directoryTree = dirTree("./", {
  exclude: [
    /node_modules/,
    /zipped_services/,
    /commontestfiles/,
    /resources/,
    /\.git/
  ]
}, null, (item, path, stats) => {
  if (errorOccurred) {
    // Abort building of further services
    return;
  }

  const pathString = item.path.toString();
  if (pathString.includes("/") || pathString.includes("\\")) {
    //console.log("Skipped path " + item.path);
  } else {
    console.log("Processing service " + pathString);
    const buildReturnCode = buildService(pathString);
    if (buildReturnCode !== 0)
      errorOccurred = true;
  }
});

function buildService(directoryPath) {
  try {
    const childProcessOptions = {
      cwd: directoryPath,
      stdio: childProcessStdioOptions,
      timeout: childProcessTimeout
    }

    // Install current processhub-sdk for child
    execSync('npm i --save https://github.com/roXtra/processhub-sdk/releases/download/' + processHubSDKVersion + '/release.tgz', childProcessOptions);
    console.log("Installed current processhub SDK for " + directoryPath);

    // Install SDK react versions
    execSync('npm i react@' + processHubSDKVersion_React, childProcessOptions);
    execSync('npm i -D @types/react@' + processHubSDKVersion_ReactTypes, childProcessOptions);
    console.log("Installed react versions according to SDK for " + directoryPath);

    // npm install
    execSync('npm install', childProcessOptions);
    console.log("Executed npm install for " + directoryPath);

    // Lint
    execSync('npm run lint', childProcessOptions);
    console.log("Executed linter for " + directoryPath);

    // tsc
    execSync('npm run build', childProcessOptions);
    console.log("Executed tsc for " + directoryPath);

    // Run tests
    execSync('npm test', childProcessOptions);
    console.log("Executed npm tests (if present) for " + directoryPath);

    // Audit
    execSync('npm audit', childProcessOptions);
    console.log("Executed npm audit for " + directoryPath);

    if (runMode === 'bundle') {
      // npm pack
      execSync('npm pack', childProcessOptions);
      console.log("Executed npm pack for " + directoryPath);

      // npm run copyandzip
      execSync('npm run copyandzip', childProcessOptions);
      console.log("Executed npm run copyandzip for " + directoryPath);
    }
  } catch (error) {
    console.log("Error occurred: " + error);
    console.log("stdout: " + error.stdout);
    console.log("stderr: " + error.stderr);
    return 1;
  }

  return 0;
}

if (errorOccurred) {
  process.exit(1);
} else {
  process.exit(0);
}