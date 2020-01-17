const test = require("tape-promise").default(require("tape-catch"));

const { promiseSerial } = require("./promise-serial");

test("promise-serial", async t => {
  const arr = await promiseSerial([
    () => Promise.resolve(2),
    () => Promise.resolve(3)
  ]);
  t.deepEqual(arr, [2, 3]);
});
