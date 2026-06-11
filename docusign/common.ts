import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { tl } from "processhub-sdk/lib/tl.js";
import { BpmnError, ErrorCode } from "processhub-sdk/lib/instance/bpmnerror.js";
import fs from "fs/promises";

export const stringifyErr = (e: unknown) => JSON.stringify(e, Object.getOwnPropertyNames(e));

export async function loadConfig(environment: IServiceTaskEnvironment, language: string) {
  const bpmnProcess = new BpmnProcess();
  await bpmnProcess.loadXml(environment.bpmnXml);
  const taskObject = bpmnProcess.getExistingTask(bpmnProcess.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new BpmnError(ErrorCode.ConfigInvalid, tl("Der Service ist nicht korrekt konfiguriert, die Konfiguration konnte nicht geladen werden.", language));
  }
  return { config, bpmnProcess };
}

export async function readConfigFile(configPath: string) {
  let configFile: {
    accountId: string;
    userId: string;
    integrationKey: string;
    privateKey: string;
    baseUrl: string;
    oauthBasePath: string;
    callbackUrlBase: string;
  } = { accountId: "", userId: "", integrationKey: "", privateKey: "", baseUrl: "", oauthBasePath: "", callbackUrlBase: "" };
  try {
    configFile = JSON.parse(await fs.readFile(configPath, "utf8"));
  } catch (e) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Failed to read config file: " + stringifyErr(e));
  }
  if (!configFile.accountId || !configFile.userId || !configFile.integrationKey || !configFile.privateKey || !configFile.baseUrl || !configFile.oauthBasePath) {
    throw new BpmnError(ErrorCode.ConfigInvalid, "Config file is missing required fields: accountId, userId, integrationKey, privateKey, baseUrl, oauthBasePath.");
  }
  return configFile;
}
