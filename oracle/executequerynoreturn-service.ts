import oracledb from "oracledb";
import { IServiceActionConfigField } from "processhub-sdk/lib/data/datainterfaces.js";
import { parseAndInsertStringWithFieldContent, replaceObjectReferences } from "processhub-sdk/lib/data/datatools.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IServiceConfigSchema, IServiceConfigSecret, readConfigFile } from "processhub-sdk/lib/servicetask/configfile.js";
import { ErrorCodes } from "./executequery-service.js";

export async function executeQueryNoReturn(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;

  const server = fields.find((f: IServiceActionConfigField) => f.key === "server")?.value;
  const port = fields.find((f: IServiceActionConfigField) => f.key === "port")?.value;
  const user = fields.find((f: IServiceActionConfigField) => f.key === "username")?.value;
  let password = fields.find((f: IServiceActionConfigField) => f.key === "password")?.value;
  const serviceName = fields.find((f: IServiceActionConfigField) => f.key === "serviceName")?.value;
  const useTls = fields.find((f: IServiceActionConfigField) => f.key === "useTls")?.value;
  let query = fields.find((f: IServiceActionConfigField) => f.key === "query")?.value;

  if (server === undefined) {
    throw new Error("server is undefined, cannot proceed with service!");
  }
  if (port === undefined) {
    throw new Error("port is undefined, cannot proceed with service!");
  }
  if (user === undefined) {
    throw new Error("user is undefined, cannot proceed with service!");
  }
  if (password === undefined) {
    throw new Error("password is undefined, cannot proceed with service!");
  }
  if (serviceName === undefined) {
    throw new Error("serviceName is undefined, cannot proceed with service!");
  }
  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed with service!");
  }

  if (environment.instanceDetails.extras.roleOwners === undefined) {
    throw new Error("environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }

  const configFile = (await readConfigFile<IServiceConfigSecret>(configPath, environment.logger, IServiceConfigSchema)) || { secret: {} };
  password = replaceObjectReferences(password, "secret", configFile.secret);

  const protocol = useTls === "true" ? "tcps://" : "";
  const connectString = `${protocol}${server}:${port}/${serviceName}`;

  query = parseAndInsertStringWithFieldContent(
    query,
    environment.instanceDetails.extras.fieldContents,
    processObject,
    environment.instanceDetails.extras.roleOwners,
    environment.sender.language || "de-DE",
    await environment.roxApi.getUsersConfig(),
    true,
  );

  if (query === undefined) {
    throw new Error("query is undefined after parseAndInsertStringWithFieldContent, cannot proceed with service!");
  }

  let connection: oracledb.Connection | undefined;
  try {
    connection = await oracledb.getConnection({
      user: user,
      password: password,
      connectString: connectString,
    });

    await connection.execute(query, [], {
      autoCommit: true,
    });
  } catch (ex) {
    console.error(`Oracle service error: ${JSON.stringify(ex)}`);
    throw new BpmnError(ErrorCodes.DB_ERROR, String(ex));
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error(`Oracle service error closing connection: ${String(closeErr)}`);
      }
    }
  }
  return true;
}
