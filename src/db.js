/**
 * A module to remember which posts we already shared in mastodon or not.
 * @module db
 */
const sqlite3 = require("sqlite3");
const path = require("path");

const {
  createStatement,
  getExistingPosts,
  getInsertStatement
} = require("./dbsql");

/**
 * Initialize the database object and the database itself (creates the table if necessary).
 * @param {import("sqlite3").Database} db The database
 * @returns {Promise<void>}  A promise resolved once the table has been successfully created
 */
const start = db =>
  new Promise((resolve, reject) => {
    return db.run(createStatement, err => (err ? reject(err) : resolve()));
  });

/**
 * @typedef {Object} DbInterface
 * @property {GetExistingIds} getExistingIds
 * @property {AddIds} addIds
 */

/**
 * @param {string} dbLocation Directory of the database
 * @param {string} dbName Filename of the database
 */
exports.getDbInterface = (dbLocation, dbName) => {
  const db = new sqlite3.Database(path.join(dbLocation, dbName));
  const close = () => {
    return new Promise((resolve, reject) =>
      db.close(err => (err ? reject(err) : resolve()))
    );
  };

  try {
    const startPromise = start(db);

    return {
      /**
       * Get the Facebook IDs already ported on mastodon between a set
       * @param {string[]} facebookIds  The list of facebook ids to check
       * @returns {Promise<string[]>}  The list of facebook ids already present in the DB
       */
      getExistingIds: facebookIds =>
        startPromise.then(
          () =>
            new Promise((resolve, reject) =>
              db.all(getExistingPosts(facebookIds), (err, rows) =>
                err
                  ? reject(err)
                  : resolve(rows.map(({ facebookPostId }) => facebookPostId))
              )
            )
        ),

      /**
       * Adds the list of given Facebook IDs to the list of the process ids.
       * @param {string[]} facebookIds  The list of Facebook ids to add.
       * @returns {Promise<void>} A promise which resolves once the ids have been added
       */
      addIds: ids =>
        ids.length === 0
          ? Promise.resolve()
          : startPromise.then(
              () =>
                new Promise((resolve, reject) =>
                  db.run(getInsertStatement(ids), err =>
                    err ? reject(err) : resolve()
                  )
                )
            ),

      /**
       * Close the underlying database, making this interface invalid.
       * @returns {Promise<void>} Completed when the DB is closed.
       */
      close
    };
  } catch (e) {
    close();
    throw e;
  }
};
