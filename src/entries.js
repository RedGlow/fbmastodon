/**
 * A full configuration for an entry.
 * @typedef {Object} Entry
 * @property {string} [name] The name of the configuratoin
 * @property {string} facebookAccessToken The access token to the page
 * @property {string} pageId ID of the page
 * @property {string} mastodonServerUrl    The URL of the Mastodon server
 * @property {string} mastodonAccessToken The Mastodon access token
 * @property {string} dbLocation Directory of the database
 * @property {string} dbName Filename of the database
 */

/**
 * A configuration file.
 * @typedef {Partial<Entry> & {entries: Array<Partial<Entry>>}} Configuration
 */

/**
 * All the keys that can be used in the configuration
 * @type {Array<keyof Entry>}
 */
const allowedKeys = [
  "name",
  "facebookAccessToken",
  "pageId",
  "mastodonServerUrl",
  "mastodonAccessToken",
  "dbLocation",
  "dbName"
];

/**
 * All the keys that are required to be present
 * @type {Array<keyof Entry>}
 */
const requiredKeys = [
  "facebookAccessToken",
  "pageId",
  "mastodonServerUrl",
  "mastodonAccessToken",
  "dbName"
];

/**
 * All the defaults for the various keys
 * @type {Partial<Entry>}
 */
const defaults = {
  dbLocation: require("../root").root
};

/**
 * Copies properties from an object to another.
 * @param {Partial<Entry>} baseObject The object to start from
 * @param {Partial<Entry>} sourceObject The object to copy the property from
 * @param {keyof Entry} propertyName The property to copy
 * @returns {Partial<Entry>} `baseObject` with the property `propertyName` copied from `sourceObject`
 */
const ck = (baseObject, sourceObject, propertyName) => ({
  ...baseObject,
  [propertyName]: sourceObject[propertyName]
});

/**
 * @callback MergeKeysFromTopPartial
 * @param {Partial<Entry>} entry The entry to complete.
 * @returns {Partial<Entry>} The entry with all the merged properties included.
 */

/**
 * Merge keys from the top object inside an entry, if not present in the entry itself.
 * @param {Configuration} configuration The configuration object
 * @returns {MergeKeysFromTopPartial}
 */
const mergeKeysFromTop = configuration => entry =>
  allowedKeys.reduce(
    (e, key) =>
      !e.hasOwnProperty(key) && configuration.hasOwnProperty(key)
        ? ck(e, configuration, key)
        : e,
    entry
  );

/**
 * Set the default values in entry, if not present.
 * @param {Partial<Entry>} entry The entry to fill with defaults
 * @returns {Partial<Entry>} The entry with the default values filled.
 */
const setDefaults = entry =>
  Object.getOwnPropertyNames(defaults).reduce(
    (e, key) => (e.hasOwnProperty(key) ? e : ck(e, defaults, key)),
    entry
  );

/**
 * Checks whether an entry has all the required keys, or throws error.
 * @param {Partial<Entry>} entry The entry for which the defaults must be filled.
 * @param {number} i The 0-based index of this entry
 * @returns {Entry} A full entry
 */
const checkRequiredKeys = (entry, i) => {
  const missingKeys = requiredKeys.filter(key => !entry.hasOwnProperty(key));
  if (missingKeys.length > 0) {
    throw new Error(
      `Entry ${i + 1} (name: ${entry[name]}) is missing keys ${missingKeys.join(
        ", "
      )}`
    );
  }
  return entry;
};

/**
 * Get a list of full entries from a configuration.
 * @param {Configuration} conf The configuration to process
 * @returns {Entry[]} An array of entries extracted from the configuration.
 */
exports.getEntries = conf =>
  conf.entries
    .map(mergeKeysFromTop(conf))
    .map(setDefaults)
    .map(checkRequiredKeys);
