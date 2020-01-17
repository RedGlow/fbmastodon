const { test } = require("./spec-helpers");

const { getLoggingSystem } = require("./logging");

const createLogger = () => {
  const entries = [];
  const logFunction = str => entries.push(str);
  const loggingSystem = getLoggingSystem(logFunction);
  return { entries, ...loggingSystem };
};

test("logging: logMonad can log a string", t => {
  const { entries, logMonad } = createLogger();
  const data = { a: 1 };
  t.equal(entries.length, 0);
  t.equal(logMonad("log entry")(data), data);
  t.deepEqual(entries, ["log entry"]);
  t.end();
});

test("logging: logMonad can log a string through a logging function", t => {
  const { entries, logMonad } = createLogger();
  const data = { a: 1 };
  t.equal(entries.length, 0);
  t.equal(logMonad(d => `log entry: ${d.a}`)(data), data);
  t.deepEqual(entries, ["log entry: 1"]);
  t.end();
});

test("logging: logContent can log a string", t => {
  const { entries, logContent } = createLogger();
  const data = { a: 1 };
  t.equal(entries.length, 0);
  t.equal(logContent(data, "log entry"), data);
  t.deepEqual(entries, ["log entry"]);
  t.end();
});

test("logging: logContent can log a string through a logging function", t => {
  const { entries, logContent } = createLogger();
  const data = { a: 1 };
  t.equal(entries.length, 0);
  t.equal(
    logContent(data, d => `log entry: ${d.a}`),
    data
  );
  t.deepEqual(entries, ["log entry: 1"]);
  t.end();
});
