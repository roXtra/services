import * as fs from "fs";
import * as PH from "processhub-sdk";
import http from "http";

async function writeFile(downloadUrl: string, targetpath: string): Promise<void> {
  const file = fs.createWriteStream(targetpath);

  return await new Promise<void>((resolve, reject) => {
    http.get(downloadUrl, function (response) {
      if (response.statusCode === 200) {
        response.pipe(file);
        resolve();
      } else {
        file.end();
        reject(response.statusCode);
      }
    });
  });
}

export async function executeFieldToFile(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;
  const fields = config.fields;

  const targetPath = fields.find(f => f.key === "targetPath").value;
  const sourceField = fields.find(f => f.key === "sourceField").value;

  try {
    const fileUrls: string[] = (environment.fieldContents[sourceField] as PH.Data.IFieldValue).value as string[];
    for (const fileUrl of fileUrls) {
      if (fileUrl) {
        const filename = fileUrl.split("/").last();

        const filepath = targetPath + "/" + filename;

        await writeFile(fileUrl, filepath);
      }
    }
  } catch (ex) {
    console.log(ex);
    return false;
  }
  return true;
}