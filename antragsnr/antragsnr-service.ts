
import * as PH from "processhub-sdk";
import { getFileStore } from "../../server/sfilestore/filestore";
import { readFileUtf8Async } from "../../server/sfilestore/localfilestore";
import { setError } from "./errorhelper";
import { getProcessInstances } from "../../server/sinstance/instances";
import { ApiContext } from "../../server/sapi/apiobjects";

export const CustomerNameFieldCaption: string = "Kundenname";
export const CustomerNumberFieldCaption: string = "Kundennr";
export const CustomerGuidFieldCaption: string = "Kundenguid";
export const CustomerSvnPathFieldCaption: string = "SvnPfad";
export const CustomerContactFieldCaption: string = "Ansprechpartner";
export const CustomerToken: string = "JWT";
export const VersionField: string = "Version";
export const UpdateField: string = "UpdateType";

export interface RoxtraCustomer {
  CrmCompanyGuid: string;
  CrmCompanyNumber: string;
  Name: string;
  CrmLicence: RoxtraCrmLicense;
  SvnCompanyName: string;
  RoxtraCustomerCrmContact?: RoxtraCustomerCrmContact[];
}

export interface RoxtraCrmLicense {
  Version?: any;
  VersionString: string;
}

export interface RoxtraCustomerCrmContact {
  Id: string;
  Salutation: string;
  Firstname: string;
  Lastname: string;
  Email: string;
  Language: string;
}

export async function antragsnrAction(environment: PH.ServiceTask.ServiceTaskEnvironment): Promise<boolean> {
  try {
    const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
    await processObject.loadXml(environment.bpmnXml);
    const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
    const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);

    const config = extensionValues.serviceTaskConfigObject;
    const fields = config.fields;
    const targetField = fields.find(f => f.key == "targetfield").value;

    const apiContext: ApiContext = new ApiContext();
    apiContext.user = environment.sender;
    apiContext.user.extras.accessToken = environment.accessToken;

    const instances = await getProcessInstances(apiContext, environment.instanceDetails.processId);

    const nr: string = environment.instanceDetails.createdAt.getFullYear().toString() + "-" + (instances.instances.length);
    const newValue: PH.Data.FieldValue = {
      value: nr,
      type: "ProcessHubTextInput",
    };

    environment.instanceDetails.extras.fieldContents[targetField] = newValue;
    await PH.Instance.updateInstance(environment.instanceDetails, environment.accessToken);
  } catch (ex) {
    await setError(environment, "(StartUpdateProcess): " + ex.toString());
    return false;
  }
  return true;
}
