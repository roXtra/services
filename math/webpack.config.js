const path = require("path");

module.exports = {
  target: "node",
  mode: "production",
  entry: {
    "addition-service": "./tmp/addition-service.js",
    "addition-config": "./tmp/addition-config.js",
    "division-service": "./tmp/division-service.js",
    "division-config": "./tmp/division-config.js",
    "multiplikation-service": "./tmp/multiplikation-service.js",
    "multiplikation-config": "./tmp/multiplikation-config.js",
    "subtraktion-service": "./tmp/subtraktion-service.js",
    "subtraktion-config": "./tmp/subtraktion-config.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
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
