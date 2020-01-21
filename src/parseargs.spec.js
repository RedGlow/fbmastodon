const { test } = require("../spec-helpers/tape");
const { parser } = require("./parseargs");

test("parseargs: correctly parses the --conf option", t => {
  const argv = parser.parse(["--conf", "configuration.json"]);
  t.equal(argv.conf, "configuration.json");
  t.end();
});

test("parseargs: a missing --conf causes an error", t => {
  parser.parse([], err => {
    t.equal(!!err, true);
    t.end();
  });
});
