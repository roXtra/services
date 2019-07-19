const PowerShell = require("powershell");

let ps = new PowerShell("Get-ChildItem -Path ./ | where {($_.psiscontainer)} | ConvertTo-Json");

ps.on("output", data => {
    data = JSON.parse(data);
    data.forEach(childDir => {
        if(childDir.Name !== "node_modules") {
        new PowerShell("cd ./" + childDir.Name + ";" + "npm install; tsc; npm run copyandzip; cd..")
        .on("output", data => {
            console.log(data);
        });
        }
    });
});