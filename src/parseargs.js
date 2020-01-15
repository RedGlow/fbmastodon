const argv = require("yargs")
  .option("conf", {
    describe: "The configuration file",
    type: "string"
  })
  .demandOption(["conf"], "Please provide a configuration file").argv;
const fs = require("fs");

exports.conf = JSON.parse(fs.readFileSync(argv.conf));
