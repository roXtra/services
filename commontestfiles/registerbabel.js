const register = require("@babel/register").default;

register({
  extensions: ".ts,.tsx,.js",
  configFile: "./../server.babel.json"
});