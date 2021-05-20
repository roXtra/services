const path = require("path");

module.exports = (env) => {
  return {
    target: "node14",
    mode: "production",
    entry: {
      main: "./main.ts",
    },
    output: {
      path: path.resolve(__dirname, env.servicename, "dist"),
      filename: "[name].js",
      libraryTarget: "commonjs2",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"],
    },
    module: {
      rules: [
        {
          test: /\.ts(x)?$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      node: "14",
                    },
                  },
                ],
                "@babel/preset-typescript",
                [
                  "@babel/preset-react",
                  {
                    runtime: "automatic",
                  },
                ],
              ],
            },
          },
        },
      ],
    },
  };
};
