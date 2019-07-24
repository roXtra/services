const PowerShell = require("powershell");

if (process.argv[2] == undefined) {
    let ps = new PowerShell("Get-ChildItem -Path ./ | where {($_.psiscontainer)} | ConvertTo-Json");

    ps.on("output", data => {
        data = JSON.parse(data);
        data.forEach(childDir => {
            if (childDir.Name !== "node_modules" && childDir.Name !== "zipped_services") {
                new PowerShell("cd ./" + childDir.Name + ";" + "npm install; tsc; npm run copyandzip; cd..")
                    .on("output", data => {
                        console.log(data);
                    });
            }
        });
    });
} else {
    new PowerShell("cd ./" + process.argv[2] + ";" + "npm install; tsc; npm run copyandzip; cd..")
        .on("output", data => {
            console.log(data);
        });

}