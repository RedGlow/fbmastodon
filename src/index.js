const { promiseSerial } = require("./promise-serial");
const { logMonad } = require("./logging");
const { conf } = require("./parseargs");
const { getEntriesFactory } = require("./entries");
const { runSingle } = require("./process");

/**
 * A full configuration for an entry.
 * @typedef {Object} Entry
 * @property {string} [name] The name of the configuration
 * @property {string} facebookAccessToken The access token to the page
 * @property {string} pageId ID of the page
 * @property {string} mastodonServerUrl    The URL of the Mastodon server
 * @property {string} mastodonAccessToken The Mastodon access token
 * @property {string} dbLocation Directory of the database
 * @property {string} dbName Filename of the database
 */

/** @type Description<Entry> */
const entryDescription = {
  name: {},
  facebookAccessToken: { required: true },
  pageId: { required: true },
  mastodonServerUrl: { required: true },
  mastodonAccessToken: { required: true },
  dbLocation: { default: require("../root").root },
  dbName: { required: true }
};

Promise.resolve()
  .then(logMonad(">>> Starting!"))
  .then(() =>
    promiseSerial(
      getEntriesFactory(entryDescription)(conf).map(entry => () =>
        runSingle(entry)
      )
    )
  )
  .then(logMonad(">>> Finished."));
