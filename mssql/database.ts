import * as sql from "mssql";
import { IServiceActionConfigField } from "processhub-sdk/lib/data/datainterfaces.js";
import { replaceObjectReferences } from "processhub-sdk/lib/data/datatools.js";
import { IServiceConfigSchema, IServiceConfigSecret, readConfigFile } from "processhub-sdk/lib/servicetask/configfile.js";
import { IServiceTaskLogger } from "processhub-sdk/lib/servicetask/servicetaskenvironment.js";

export async function getConnectionPool(fields: IServiceActionConfigField[], logger: IServiceTaskLogger, configPath: string): Promise<sql.ConnectionPool> {
  const configFile = (await readConfigFile<IServiceConfigSecret>(configPath, logger, IServiceConfigSchema)) || { secret: {} };

  const server = fields.find((f) => f.key === "server")?.value;
  const user = fields.find((f) => f.key === "username")?.value;
  let password = fields.find((f) => f.key === "password")?.value;
  const database = fields.find((f) => f.key === "database")?.value;

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

  password = replaceObjectReferences(password, "secret", configFile.secret);

  // Config for your database
  const dbConfig = {
    user: user,
    password: password,
    server: server,
    database: database,
    options: {
      trustServerCertificate: true,
    },
  };
  const pool = new sql.ConnectionPool(dbConfig);
  return pool;
}
