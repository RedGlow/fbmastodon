const { join } = require("path");

const { test } = require("../spec-helpers/tape");
const { testDbWrapper } = require("../spec-helpers/db");

test(
  "Database: create table",
  testDbWrapper(
    null,
    dbInterface => dbInterface.getExistingIds([]),
    async (t, dbInterface) => {
      const res = await dbInterface.all(
        "SELECT name FROM sqlite_master WHERE type='table'"
      );
      t.deepEquals(
        res.map(({ name }) => name),
        ["posts"]
      );
    }
  )
);

test(
  "Database: get no ids if the table is empty",
  testDbWrapper(
    null,
    dbInterface => dbInterface.getExistingIds(["20", "30", "40"]),
    async (t, _, results) => {
      t.equal(results.length, 0);
    }
  )
);

test(
  "Database: get some ids if the table is not empty",
  testDbWrapper(
    join(__dirname, "db.dump-some-fbids.sql"),
    dbInterface => dbInterface.getExistingIds(["20", "30", "40"]),
    async (t, _, results) => {
      t.deepEquals(results, ["20"]);
    }
  )
);

test(
  "Database: adding some ids allow to find them afterwards",
  testDbWrapper(
    null,
    dbInterface =>
      Promise.all([
        dbInterface.addEntry({
          facebookPostId: "20",
          pageId: "",
          mastodonPostId: "",
          mastodonServerUrl: ""
        }),
        dbInterface.addEntry({
          facebookPostId: "30",
          pageId: "",
          mastodonPostId: "",
          mastodonServerUrl: ""
        })
      ]),
    async (t, dbInterface) =>
      t.deepEquals(
        (await dbInterface.all("SELECT facebookPostId FROM posts")).map(
          ({ facebookPostId }) => facebookPostId
        ),
        ["20", "30"]
      )
  )
);
