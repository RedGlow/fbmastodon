const { isAbsolute, join } = require("path");
const { cwd } = require("process");
const { readFileSync } = require("fs");

exports.parser = require("yargs")
  .option("conf", {
    describe: "The configuration file",
    type: "string"
  })
  .demandOption(["conf"], "Please provide a configuration file");

exports.getConf = argv => {
  const c = exports.parser.parse(argv).conf;
  return JSON.parse(readFileSync(isAbsolute(c) ? c : join(cwd(), c)));
};
