const { test } = require("./spec-helpers");

const { getLoggingSystem } = require("./logging");

const testLogFunction = logFunction => (t, fn, expected) => {
  const entries = [];
  const loggingSystem = getLoggingSystem(str => entries.push(str));
  const data = { a: 1 };
  t.equal(entries.length, 0);
  t.equal(logFunction(loggingSystem, fn, data), data);
  t.deepEqual(entries, [expected]);
  t.end();
};

[
  {
    fnName: "logMonad",
    fnTest: testLogFunction(({ logMonad }, fn, data) => logMonad(fn)(data))
  },
  {
    fnName: "logContent",
    fnTest: testLogFunction(({ logContent }, fn, data) => logContent(data, fn))
  }
].forEach(({ fnName, fnTest }) =>
  [
    {
      what: "a string",
      value: "log entry",
      expected: "log entry"
    },
    {
      what: "a string through a logging function",
      value: d => `log entry: ${d.a}`,
      expected: "log entry: 1"
    }
  ].forEach(({ what, value, expected }) =>
    test(`logging: ${fnName} can log ${what}`, t => fnTest(t, value, expected))
  )
);
