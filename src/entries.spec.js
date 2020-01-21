const { test } = require("../spec-helpers/tape");

const { getEntriesFactory } = require("./entries");

const description = {
  notRequiredKey: {},
  requiredKey: { required: true },
  keyWithDefault: { default: 33 },
  requiredKeyWithDefault: { required: true, default: 44 }
};

test("entries: merge keys from top", t => {
  const entries = getEntriesFactory(description)({
    requiredKey: 12,
    entries: [
      {
        requiredKey: 23
      },
      {}
    ]
  });
  t.deepEqual(entries[0], {
    requiredKey: 23,
    keyWithDefault: 33,
    requiredKeyWithDefault: 44
  });
  t.deepEqual(entries[1], {
    requiredKey: 12,
    keyWithDefault: 33,
    requiredKeyWithDefault: 44
  });
  t.end();
});

test("entries: sets defaults", t => {
  const entries = getEntriesFactory(description)({
    entries: [{ requiredKey: 12 }]
  });
  t.deepEqual(entries[0], {
    requiredKey: 12,
    keyWithDefault: 33,
    requiredKeyWithDefault: 44
  });
  t.end();
});

test("entries: check required keys", t => {
  const getEntries = getEntriesFactory(description);
  t.throws(() =>
    getEntries({
      entries: [{}]
    })
  );
  getEntries({ entries: [{ requiredKey: 12 }] }); // this does not throw
  t.end();
});
