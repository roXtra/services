const fs = require("fs");
import * as PH from "processhub-sdk";

export async function executeFieldToFile(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  let processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  let taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  let extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  let config = extensionValues.serviceTaskConfigObject;
  let fields = config.fields;

  let targetPath = fields.find(f => f.key == "targetPath").value;
  let sourceField = fields.find(f => f.key == "sourceField").value;

  // connect to your database
  try {

    let baseDir = null;
    if (fs.existsSync(process.cwd() + "/roxtra-config-custom.json")) {
      let customConfigString = fs.readFileSync(process.cwd() + "/roxtra-config-custom.json", "utf8");
      let configObj = JSON.parse(customConfigString);
      if (configObj["Filestore"] != null && configObj["Filestore"]["baseDir"] != null && configObj["Filestore"]["baseDir"] != "") {
        baseDir = configObj["Filestore"]["baseDir"];
      }
    }

    if (baseDir == null && fs.existsSync(process.cwd() + "/roxtra-config.json")) {
      let customConfigString = fs.readFileSync(process.cwd() + "/roxtra-config.json", "utf8");
      let configObj = JSON.parse(customConfigString);
      if (configObj["Filestore"] != null && configObj["Filestore"]["baseDir"] != null && configObj["Filestore"]["baseDir"] != "") {
        baseDir = configObj["Filestore"]["baseDir"];
      }
    }

    if (baseDir == null) {
      return false;
    }

    let fileUrls: string[] = (environment.instanceDetails.extras.fieldContents[sourceField] as PH.Data.FieldValue).value as string[];
    for (let fileUrl of fileUrls) {
      if (fileUrl != null && fileUrl != "") {

        const url = fileUrl;
        const downloadRoutPrefix: string = "eformulare/files/";
        const downloadRoutePrefixIdx: number = url.indexOf(downloadRoutPrefix);
        const draftFileKey: string = url.substr(downloadRoutePrefixIdx + downloadRoutPrefix.length);
        let filePath = baseDir + "/" + draftFileKey;

        let filename = fileUrl.split("/").last();

        /*let dir = "tmp";

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }*/
        // + environment.instanceDetails.instanceId + "/"
        fs.createReadStream(filePath).pipe(fs.createWriteStream(targetPath + "/" + filename));
        // let promise = new Promise<void>((resolve, reject) => {
        //   try {
        //     http.get(fileUrl, (response: any) => {
        //       let filename = fileUrl.split("/").last();
        //       console.log(filename);
        //       console.log(targetPath + "/" + filename);
        //       const file = fs.createWriteStream(targetPath + "/" + filename);
        //       response.pipe(file);
        //       resolve();
        //     });
        //   } catch (ex) {
        //     reject();
        //     return false;
        //   }
        // });
        // await promise;
      }
    }

  } catch (ex) {
    console.log(ex);
    return false;
  }
  return true;
}