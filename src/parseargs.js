const { readFileSync } = require("fs");
exports.parser = require("yargs")
  .option("conf", {
    describe: "The configuration file",
    type: "string"
  })
  .demandOption(["conf"], "Please provide a configuration file");

exports.getConf = argv =>
  JSON.parse(readFileSync(exports.parser.parse(argv).conf));
