const { test } = require("../spec-helpers/tape");
const { promiseSerial } = require("./promise-serial");

test("promise-serial: given two promises, promiseSerial returns a promise with the results", async t => {
  const arr = await promiseSerial([
    () => Promise.resolve(2),
    () => Promise.resolve(3)
  ]);
  t.deepEqual(arr, [2, 3]);
});

test("promise-serial: given a number of promises, they are resolved in order", async t => {
  const data = [
    1,
    4,
    3,
    5,
    8,
    4,
    6,
    9,
    7,
    2,
    4,
    3,
    5,
    5,
    7,
    6,
    85,
    4,
    65,
    3,
    3,
    56,
    4,
    765,
    87,
    687,
    2,
    42,
    45,
    3245,
    3,
    545
  ];
  const results = await promiseSerial(
    data.map(value => () => Promise.resolve(value))
  );
  t.deepEqual(data, results);
});
