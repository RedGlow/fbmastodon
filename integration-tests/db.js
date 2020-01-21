const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");

const { test } = require("../src/spec-helpers");
const { getDbInterface } = require("../src/db");

// transform a function with callback in a function returning a promise
const promisifyFunc = fn => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, res) => (err ? reject(err) : resolve(res)))
  );

/**
 * @typedef {Object} SimpleDbInterface
 * @property {(sql: string) => Promise<any>} all  Runs a SQL SELECT query and returns all the results as objects
 */

/**
 * @template T
 * @callback ActOnDatabaseFn
 * @param {import("../src/db").DbInterface} dbInterface The database interface to use
 * @return {Promise<T>} An optional result inside a promise
 */

/**
 * @template T
 * @callback TestDatabaseFn
 * @param {import("tape").Test} t The test case to run tests
 * @param {SimpleDbInterface} simpleDbInterface A simplified DB interface to access the DB
 * @param {T} result The result of the actOnDatabaseFn
 * @returns {Promise<void>} A promise resolved once the test is completed
 */

/**
 * @template T
 * @param {string | null} sqlFile Name of a SQL file to run in order to prepare the DB for the test, or null if not used
 * @param actOnDatabaseFn {ActOnDatabaseFn<T>} Callback to run some action on the DB and return an optional result as a promise
 * @param testDatabaseFn {TestDatabaseFn<T>} Callback to run the tests
 */
const testDbWrapper = (sqlFile, actOnDatabaseFn, testDatabaseFn) => async t => {
  // create file and prepare cleanup
  const filename = crypto.randomBytes(4).readUInt32LE(0) + ".db";
  const fullpath = path.join(__dirname, filename);
  const cleanupFile = () => {
    if (fs.existsSync(fullpath)) {
      fs.unlinkSync(fullpath);
    }
  };

  // func to open db and close it
  const getDbAndCleanup = () => {
    const db = new sqlite3.Database(fullpath);
    const [dbClose, dbRun, dbAll] = [db.close, db.run, db.all].map(m =>
      promisifyFunc(m.bind(db))
    );
    let closingDbPromise = null;
    const cleanupDb = () => (closingDbPromise = closingDbPromise || dbClose());
    return { dbRun, dbAll, cleanupDb };
  };

  try {
    // if we have a preparation sql file, execute it line by line
    if (sqlFile) {
      const { dbRun, cleanupDb } = getDbAndCleanup();
      try {
        const fileContent = fs
          .readFileSync(path.join(__dirname, sqlFile), { encoding: "UTF-8" })
          .split(";")
          .filter(x => x.trim().length > 0)
          .map(l => l + ";");
        const callbacks = fileContent.map(line => () => dbRun(line));

        for (var i = 0; i < callbacks.length; i++) {
          await callbacks[i]();
        }
      } finally {
        await cleanupDb();
      }
    }

    // call the function using the library interface
    const dbInterface = getDbInterface(__dirname, filename);
    let result;
    try {
      result = await actOnDatabaseFn(dbInterface);
    } finally {
      await dbInterface.close();
    }

    // reopen the DB with (almost) direct SQLite access to check everything worked
    const { dbAll, cleanupDb } = getDbAndCleanup();
    try {
      const simpleDbInterface = {
        all: dbAll
      };
      await testDatabaseFn(t, simpleDbInterface, result);
    } finally {
      await cleanupDb();
    }
  } finally {
    cleanupFile();
  }
};

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
    "db.dump-some-fbids.sql",
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
