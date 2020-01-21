const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");

const { test } = require("../src/spec-helpers");
const { getDbInterface } = require("../src/db");

const promisifyFunc = fn => (...args) =>
  new Promise((resolve, reject) =>
    fn(...args, (err, res) => (err ? reject(err) : resolve(res)))
  );

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
    async (t, dbInterface, results) => {
      t.equal(results.length, 0);
    }
  )
);

test(
  "Database: get some ids if the table is not empty",
  testDbWrapper(
    "db.dump-some-fbids.sql",
    dbInterface => dbInterface.getExistingIds(["20", "30", "40"]),
    async (t, dbInterface, results) => {
      t.deepEquals(results, ["20"]);
    }
  )
);
