const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");

const { test } = require("../src/spec-helpers");
const { getDbInterface } = require("../src/db");

const testDbWrapper = (sqlFile, actOnDatabaseFn, testDatabaseFn) => t => {
  const filename = crypto.randomBytes(4).readUInt32LE(0) + ".db";
  const fullpath = path.join(__dirname, filename);
  const cleanupFile = () => {
    if (fs.existsSync(fullpath)) {
      fs.unlinkSync(fullpath);
    }
  };

  const getDbAndCleanup = () => {
    const db = new sqlite3.Database(fullpath);

    let closingDbPromise = null;
    const cleanupDb = () => {
      closingDbPromise =
        closingDbPromise ||
        new Promise((resolve, reject) => {
          db.close(err => (err ? reject(err) : resolve()));
        });
      return closingDbPromise;
    };

    return { db, cleanupDb };
  };

  const preparePromise = sqlFile
    ? new Promise((resolve, reject) => {
        const { db, cleanupDb } = getDbAndCleanup();
        try {
          const fileContent = fs
            .readFileSync(path.join(__dirname, sqlFile), { encoding: "UTF-8" })
            .split(";")
            .filter(x => x.trim().length > 0)
            .map(l => l + ";");
          let num = 0;

          db.serialize(() => {
            fileContent.forEach(line =>
              db.run(line, err => {
                if (err) {
                  cleanupDb().then(() => reject(err));
                } else {
                  num++;
                  if (num === fileContent.length) {
                    db.close(err => (err ? reject(err) : resolve()));
                  }
                }
              })
            );
          });
        } catch (e) {
          return cleanupDb().then(() => reject(e));
        }
      })
    : Promise.resolve();

  return preparePromise
    .then(() => {
      const dbInterface = getDbInterface(__dirname, filename);
      return actOnDatabaseFn(dbInterface)
        .catch(e => dbInterface.close().then(() => Promise.reject(e)))
        .then(result => {
          dbInterface.close();

          const { db, cleanupDb } = getDbAndCleanup();

          try {
            const dbInterface = {
              all: sql =>
                new Promise((resolve, reject) =>
                  db.all(sql, (err, res) => (err ? reject(err) : resolve(res)))
                )
            };
            return testDatabaseFn(t, dbInterface, result).finally(cleanupDb);
          } catch (e) {
            cleanupDb();
            throw e;
          }
        });
    })
    .finally(cleanupFile);
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
    "dump-some-fbids.sql",
    dbInterface => dbInterface.getExistingIds(["20", "30", "40"]),
    async (t, dbInterface, results) => {
      t.deepEquals(results, ["20"]);
    }
  )
);

test(
  "Database: find ids if they are added",
  testDbWrapper(null, dbInterface => dbInterface.addIds())
);
