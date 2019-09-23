import * as fs from "fs";
import * as PH from "processhub-sdk";

export async function executeFieldToFile(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;

  const targetPath = fields.find(f => f.key === "targetPath").value;
  const sourceField = fields.find(f => f.key === "sourceField").value;

  // Connect to your database
  try {

    let baseDir = null;
    if (fs.existsSync(process.cwd() + "/roxtra-config-custom.json")) {
      const customConfigString = fs.readFileSync(process.cwd() + "/roxtra-config-custom.json", "utf8");
      const configObj = JSON.parse(customConfigString);
      if (configObj["Filestore"] != null && configObj["Filestore"]["baseDir"] != null && configObj["Filestore"]["baseDir"] !== "") {
        baseDir = configObj["Filestore"]["baseDir"];
      }
    }

    if (baseDir == null && fs.existsSync(process.cwd() + "/roxtra-config.json")) {
      const customConfigString = fs.readFileSync(process.cwd() + "/roxtra-config.json", "utf8");
      const configObj = JSON.parse(customConfigString);
      if (configObj["Filestore"] != null && configObj["Filestore"]["baseDir"] != null && configObj["Filestore"]["baseDir"] !== "") {
        baseDir = configObj["Filestore"]["baseDir"];
      }
    }

    if (baseDir == null) {
      return false;
    }

    const fileUrls: string[] = (environment.instanceDetails.extras.fieldContents[sourceField] as PH.Data.FieldValue).value as string[];
    for (const fileUrl of fileUrls) {
      if (fileUrl != null && fileUrl !== "") {

        const url = fileUrl;
        const downloadRoutPrefix = "eformulare/files/";
        const downloadRoutePrefixIdx: number = url.indexOf(downloadRoutPrefix);
        const draftFileKey: string = url.substr(downloadRoutePrefixIdx + downloadRoutPrefix.length);
        const filePath = baseDir + "/" + draftFileKey;

        const filename = fileUrl.split("/").last();

        // eslint-disable-next-line capitalized-comments
        /* let dir = "tmp";

        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }*/
        // + environment.instanceDetails.instanceId + "/"
        fs.createReadStream(filePath).pipe(fs.createWriteStream(targetPath + "/" + filename));
        // eslint-disable-next-line capitalized-comments
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