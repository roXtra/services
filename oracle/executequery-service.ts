import oracledb from "oracledb";
import { parseAndInsertStringWithFieldContent, replaceObjectReferences } from "processhub-sdk/lib/data/datatools.js";
import { FieldType, FieldValueType } from "processhub-sdk/lib/data/ifieldvalue.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { IServiceConfigSchema, IServiceConfigSecret, readConfigFile } from "processhub-sdk/lib/servicetask/configfile.js";

export enum ErrorCodes {
  DB_ERROR = "DB_ERROR",
}

export async function executeQuery(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const serviceTaskConfig = extensionValues.serviceTaskConfigObject;

  if (serviceTaskConfig === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = serviceTaskConfig.fields;

  const server = fields.find((f) => f.key === "server")?.value;
  const port = fields.find((f) => f.key === "port")?.value;
  const user = fields.find((f) => f.key === "username")?.value;
  let password = fields.find((f) => f.key === "password")?.value;
  const serviceName = fields.find((f) => f.key === "serviceName")?.value;
  const useTls = fields.find((f) => f.key === "useTls")?.value;
  let query = fields.find((f) => f.key === "query")?.value;
  const targetField = fields.find((f) => f.key === "targetField")?.value;

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
  if (targetField === undefined) {
    throw new Error("targetField is undefined, cannot proceed with service!");
  }

  if (environment.instanceDetails.extras.roleOwners === undefined) {
    throw new Error("environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }
  if (environment.instanceDetails.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  const configFile = (await readConfigFile<IServiceConfigSecret>(configPath, environment.logger, IServiceConfigSchema)) || { secret: {} };
  password = replaceObjectReferences(password, "secret", configFile.secret);

  const protocol = useTls === "true" ? "tcps://" : "";
  const connectString = `${protocol}${server}:${port}/${serviceName}`;

  let connection: oracledb.Connection | undefined;
  try {
    connection = await oracledb.getConnection({
      user: user,
      password: password,
      connectString: connectString,
    });

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

    const result = await connection.execute<{ result: FieldValueType | undefined | null }>(query, [], {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });

    const rows = result.rows;

    if (rows && rows.length > 0) {
      if (!environment.instanceDetails.extras.fieldContents?.[targetField]) {
        const fields = processObject.getFieldDefinitions();
        const field = fields.find((f) => f.name === targetField);
        const targetFieldType: FieldType = field ? field.type : "ProcessHubTextInput";

        environment.instanceDetails.extras.fieldContents[targetField] = {
          value: undefined,
          type: targetFieldType,
        };
      }
      // The property environment.instanceDetails.extras.fieldContents[targetField] is definitely assigned here as it is checked or initialized in the lines above
      environment.instanceDetails.extras.fieldContents[targetField].value = rows[0].result;
      await environment.instances.updateInstance(environment.instanceDetails);
    }
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
