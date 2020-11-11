import * as sql from "mssql";
import * as PH from "processhub-sdk";

export async function executeQuery(environment: PH.ServiceTask.IServiceTaskEnvironment): Promise<boolean> {
  const processObject: PH.Process.BpmnProcess = new PH.Process.BpmnProcess();
  await processObject.loadXml(environment.bpmnXml);
  const taskObject = processObject.getExistingTask(processObject.processId(), environment.bpmnTaskId);
  const extensionValues = PH.Process.BpmnProcess.getExtensionValues(taskObject);
  const config = extensionValues.serviceTaskConfigObject;

  if (config === undefined) {
    throw new Error("Config is undefined, cannot proceed with service!");
  }

  const fields = config.fields;

  const server = fields.find((f) => f.key === "server")?.value;
  const user = fields.find((f) => f.key === "username")?.value;
  const password = fields.find((f) => f.key === "password")?.value;
  const database = fields.find((f) => f.key === "database")?.value;
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
  if (query === undefined) {
    throw new Error("query is undefined, cannot proceed with service!");
  }
  if (targetField === undefined) {
    throw new Error("targetField is undefined, cannot proceed with service!");
  }

  // Config for your database
  const dbConfig = {
    user: user,
    password: password,
    server: server,
    database: database,
  };
  const pool = new sql.ConnectionPool(dbConfig);

  if (environment.instanceDetails.extras.roleOwners === undefined) {
    throw new Error("environment.instanceDetails.extras.roleOwners is undefined, cannot proceed with service!");
  }
  if (environment.instanceDetails.extras.fieldContents === undefined) {
    throw new Error("fieldContents are undefined, cannot proceed with service!");
  }

  // Connect to your database
  try {
    await pool.connect();

    query = PH.Data.parseAndInsertStringWithFieldContent(
      query,
      environment.instanceDetails.extras.fieldContents,
      processObject,
      environment.instanceDetails.extras.roleOwners,
      true,
    );

    if (query === undefined) {
      throw new Error("query is undefined after parseAndInsertStringWithFieldContent, cannot proceed with service!");
    }

    const result = await pool.request().query(query);

    const rows = result.recordset;
    // Res.setHeader("Access-Control-Allow-Origin", "*");
    // res.status(200).json(rows);
    if (rows.length > 0) {
      if (!environment.instanceDetails.extras.fieldContents?.[targetField]) {
        const fields = processObject.getFieldDefinitions();
        const field = fields.find((f) => f.name === targetField);
        const targetFieldType: PH.Data.FieldType = field ? field.type : "ProcessHubTextInput";

        environment.instanceDetails.extras.fieldContents[targetField] = {
          value: undefined,
          type: targetFieldType,
        };
      }
      (environment.instanceDetails.extras.fieldContents[targetField] as PH.Data.IFieldValue).value = rows[0].result;
      await environment.instances.updateInstance(environment.instanceDetails);
    }
  } catch (ex) {
    // Res.status(500).send({ message: "${err}" });
    return false;
  } finally {
    await pool.close();
  }
  return true;
}
