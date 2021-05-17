const path = require("path");

module.exports = (env) => {
  return {
    target: "node",
    mode: "production",
    entry: {
      main: "./tmp/main.js",
    },
    output: {
      path: path.resolve(__dirname, env.servicename, "dist"),
      filename: "[name].js",
      libraryTarget: "commonjs2",
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    targets: {
                      node: "current",
                    },
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
