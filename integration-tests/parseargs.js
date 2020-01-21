const { join } = require("path");
const { test } = require("../spec-helpers/tape");
const { getConf } = require("../src/parseargs");

test("getConf: parse a file in the current directory", t => {
  const conf = getConf(["--conf", "integration-tests/parseargs/conf.json"]);
  t.equal(conf.a, 33);
  t.end();
});

test("getConf: parse a file with full path", t => {
  const conf = getConf(["--conf", join(__dirname, "parseargs/conf.json")]);
  t.equal(conf.a, 33);
  t.end();
});
