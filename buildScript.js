const PowerShell = require("powershell");

const exceptions = [
    "node_modules",
    "zipped_services",
    "resources"
]

if (process.argv[2] == undefined) {
    let ps = new PowerShell("Get-ChildItem -Path ./ | where {($_.psiscontainer)} | ConvertTo-Json");

    ps.on("output", data => {
        data = JSON.parse(data);
        data.forEach(childDir => {
            if (checkExceptions(childDir.Name)) {
                new PowerShell("cd ./" + childDir.Name + ";" + "npm install; tsc; npm run copyandzip; cd..")
                    .on("output", data => {
                        console.log(data);
                    });
            }
        });
    });
} else if (checkExceptions(process.argv[2])) {
    new PowerShell("cd ./" + process.argv[2] + ";" + "npm install; tsc; npm run copyandzip; cd..")
        .on("output", data => {
            console.log(data);
        });
} else {
     console.error("The choosen directory is no service.");
}

function checkExceptions(childDirName) {
    let bool = true;

    for (let i in exceptions) {

        if (childDirName === exceptions[i]) {
            bool = false;
            break;
        }
    }

    return bool;
}