const path = require("path");

module.exports = (env) => {
  return {
    target: "node14",
    mode: "production",
    entry: {
      main: path.resolve(__dirname, env.servicename, "main.ts"),
    },
    output: {
      path: path.resolve(__dirname, env.servicename, "dist"),
      filename: "[name].js",
      libraryTarget: "commonjs2",
    },
    optimization: {
      // mysql package does not support minimize: https://github.com/mysqljs/mysql/issues/1655
      minimize: env.servicename !== "mysql",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"],
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
