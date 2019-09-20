const dirTree = require('directory-tree');
const { execSync } = require('child_process');

const processHubSDKVersion = 'v8.9.0-0';

const childProcessStdioOptions = [0, 1, 2];
const childProcessTimeout = 300000;

let errorOccurred = false;

const directoryTree = dirTree("./", {
    exclude: [
        /node_modules/,
        /zipped_services/,
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
    /* new PowerShell("cd ./" + childDir.Name + ";" + "npm install; tsc; npm run copyandzip; cd..")
                .on("output", data => {
                    console.log(data);
                }); */
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

        // npm install
        execSync('npm install', childProcessOptions);
        console.log("Executed npm install for " + directoryPath);

        // tsc
        execSync('tsc', childProcessOptions);
        console.log("Executed tsc for " + directoryPath);

        // npm run copyandzip
        execSync('npm run copyandzip', childProcessOptions);
        console.log("Executed npm run copyandzip for " + directoryPath);
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