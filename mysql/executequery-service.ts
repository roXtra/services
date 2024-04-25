import * as mysql from "mysql";
import { FieldType, FieldValueType, IFieldValue } from "processhub-sdk/lib/data/ifieldvalue.js";
import { BpmnError } from "processhub-sdk/lib/instance/bpmnerror.js";
import { BpmnProcess } from "processhub-sdk/lib/process/bpmn/bpmnprocess.js";
import { IServiceTaskEnvironment } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";
import { parseAndInsertStringWithFieldContent, replaceObjectReferences } from "processhub-sdk/lib/data/datatools.js";
import { IServiceConfigSchema, IServiceConfigSecret, readConfigFile } from "processhub-sdk/lib/servicetask/configfile.js";

enum ErrorCodes {
  DB_ERROR = "DB_ERROR",
}

export async function executeQuery(environment: IServiceTaskEnvironment, configPath: string): Promise<boolean> {
  const processObject: BpmnProcess = new BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;

  const server = fields.find((f) => f.key === "server")?.value;
  const user = fields.find((f) => f.key === "username")?.value;
  let password = fields.find((f) => f.key === "password")?.value;
  const database = fields.find((f) => f.key === "database")?.value;
  const port = fields.find((f) => f.key === "port")?.value;
  let query = fields.find((f) => f.key === "query")?.value;
  const targetField = fields.find((f) => f.key === "targetField")?.value;

  if (server === undefined) {
    throw new Error("server is undefined, cannot proceed with service!");
  }
  if (user === undefined) {
    throw new Error("user is undefined, cannot proceed with service!");
  }
  if (password === undefined) {
    throw new Error("password is undefined, cannot proceed with service!");
  }
  if (database === undefined) {
    throw new Error("database is undefined, cannot proceed with service!");
  }
  if (port === undefined) {
    throw new Error("port is undefined, cannot proceed with service!");
  }
  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed with service!");
  }
  if (targetField === undefined) {
    throw new Error("targetField is undefined, cannot proceed with service!");
  }

  const configFile = (await readConfigFile<IServiceConfigSecret>(configPath, IServiceConfigSchema, environment.logger)) || { secret: {} };

  password = replaceObjectReferences(password, "secret", configFile.secret);

  const connection = mysql.createConnection({
    user: user,
    password: password,
    host: server,
    database: database,
    port: parseInt(port),
  });

  if (environment.instanceDetails.extras.roleOwners === undefined) {
    throw new Error("environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }

  try {
    query = parseAndInsertStringWithFieldContent(
      query,
      environment.instanceDetails.extras.fieldContents,
      processObject,
      environment.instanceDetails.extras.roleOwners,
      environment.sender.language || "de-DE",
      await environment.roxApi.getUsersConfig(),
      true,
    );

    console.log(`MySQL service: executing ${String(query)}`);

    connection.connect();
    const res = await new Promise<{ result: FieldValueType | undefined | null }[]>((resolve, reject) => {
      if (query === undefined) {
        throw new Error("query is undefined after parseAndInsertStringWithFieldContent, cannot proceed with service!");
      }
      connection.query(query, function (error: mysql.MysqlError | null, results: { result: FieldValueType | undefined | null }[]) {
        if (error) reject(error);
        resolve(results);
      });
    });
    connection.end();
    console.log("MySQL service: connection closed.");

    if (res.length > 0) {
      if (!environment.instanceDetails.extras.fieldContents?.[targetField]) {
        const fields = processObject.getFieldDefinitions();
        const field = fields.find((f) => f.name === targetField);
        const targetFieldType: FieldType = field ? field.type : "ProcessHubTextInput";

        if (environment.instanceDetails.extras.fieldContents === undefined) {
          environment.instanceDetails.extras.fieldContents = {};
        }

        environment.instanceDetails.extras.fieldContents[targetField] = {
          value: undefined,
          type: targetFieldType,
        };
      }
      (environment.instanceDetails.extras.fieldContents[targetField] as IFieldValue).value = res[0]["result"];
      await environment.instances.updateInstance(environment.instanceDetails);
    }
  } catch (ex) {
    console.error(`MySQL service error: ${JSON.stringify(ex)}`);
    throw new BpmnError(ErrorCodes.DB_ERROR, String(ex));
  }
  return true;
}
