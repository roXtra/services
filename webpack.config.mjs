import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env) => {
  return {
    target: "node18",
    mode: "production",
    entry: {
      main: path.resolve(__dirname, env.servicename, "main.ts"),
    },
    experiments: {
      outputModule: true,
    },
    output: {
      path: path.resolve(__dirname, env.servicename, "dist"),
      filename: "[name].js",
      library: {
        type: "module",
      },
    },
    optimization: {
      // mysql package does not support minimize: https://github.com/mysqljs/mysql/issues/1655
      minimize: env.servicename !== "mysql",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"],
      extensionAlias: { ".js": [".ts", ".js", ".tsx"] },
    },
    module: {
      rules: [
        {
          test: function (modulePath) {
            return modulePath.endsWith(".ts") || modulePath.endsWith(".tsx");
          },
          use: {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(__dirname, env.servicename, "tsconfig-webpack.json"),
            },
          },
        },
      ],
    },
  };
};
