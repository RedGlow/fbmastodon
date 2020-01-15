/**
 * A module to remember which posts we already shared in mastodon or not.
 * @module db
 */
const sqlite3 = require("sqlite3");
const path = require("path");

/**
 * A map between file names and databases.
 * @type {Object.<string, import("sqlite3").Database>}}
 */
const dbs = {};

/**
 * Returns a DB object starting from a location and a file name, reusing database objects.
 * @param {string} dbLocation Directory of the database
 * @param {string} dbName Filename of the database
 * @returns {import("sqlite3").Database}  The database
 */
const getDb = (dbLocation, dbName) => {
  const fname = path.join(dbLocation, dbName);
  dbs[fname] = dbs[fname] || new sqlite3.Database(fname);
  return dbs[fname];
};

/**
 * Initialize the database object and the database itself (creates the table if necessary).
 * @param {import("sqlite3").Database} db The database
 * @returns {Promise<void>}  A promise resolved once the table has been successfully created
 */
const start = db =>
  new Promise((resolve, reject) => {
    return db.run(
      `CREATE TABLE IF NOT EXISTS posts (
      facebookPostId TEXT PRIMARY KEY,
      mastodonPostId TEXT
  )`,
      err => (err ? reject(err) : resolve())
    );
  });

/**
 * Get the Facebook IDs already ported on mastodon between a set
 * @callback GetExistingIds
 * @param {string[]} facebookIds  The list of facebook ids to check
 * @returns {Promise<string[]>}  The list of facebook ids already present in the DB
 */

/**
 * Adds the list of given Facebook IDs to the list of the process ids.
 * @callback AddIds
 * @param {string[]} facebookIds  The list of Facebook ids to add.
 * @returns {Promise<void>} A promise which resolves once the ids have been added
 */

/**
 * @typedef {Object} DbInterface
 * @property {GetExistingIds} getExistingIds
 * @property {AddIds} addIds
 */

/**
 * @param {string} dbLocation Directory of the database
 * @param {string} dbName Filename of the database
 * @returns {DbInterface} The interface to the DB
 */
exports.getDbInterface = (dbLocation, dbName) => {
  const db = getDb(dbLocation, dbName);
  const startPromise = start(db);

  return {
    getExistingIds: facebookIds =>
      startPromise.then(
        () =>
          new Promise((resolve, reject) =>
            db.all(
              `SELECT facebookPostId FROM posts WHERE facebookPostId IN (${facebookIds
                .map(id => `'${id}'`)
                .join(", ")})`,
              (err, rows) =>
                err
                  ? reject(err)
                  : resolve(rows.map(({ facebookPostId }) => facebookPostId))
            )
          )
      ),

    addIds: ids =>
      ids.length === 0
        ? Promise.resolve()
        : start.then(
            () =>
              new Promise((resolve, reject) =>
                db.run(
                  `INSERT INTO
  posts (facebookPostId, mastodonPostId)
VALUES
  ${ids
    .map(
      ({ facebookPostId, mastodonPostId }) =>
        `('${facebookPostId}', '${mastodonPostId}')`
    )
    .join(",\n  ")}`,
                  err => (err ? reject(err) : resolve())
                )
              )
          )
  };
};
