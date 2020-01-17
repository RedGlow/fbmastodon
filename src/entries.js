/**
 * The description of an entry type
 * @template T The entry type
 * @typedef {{[P in keyof T]: {required?: boolean, default?: any}}} Description<T>
 */

/**
 * A configuration.
 * @template T The entry type
 * @typedef {Partial<T> & {entries: Array<Partial<T>>}} Configuration<T>
 */

/**
 * @template TEntry The entry type
 * @param {Description<TEntry>} description
 */
exports.getEntriesFactory = description => {
  /**
   * The keys that can be used.
   * @type {Array<keyof TEntry>} All the properties of this object.
   */
  const allowedKeys = Object.getOwnPropertyNames(description);

  /**
   * @callback MergeKeysFromTopPartial
   * @param {Partial<TEntry>} entry The entry to complete.
   * @returns {Partial<TEntry>} The entry with all the merged properties included.
   */

  /**
   * Merge keys from the top object inside an entry, if not present in the entry itself.
   * @param {Configuration<TEntry>} conf The configuration object
   * @returns {MergeKeysFromTopPartial}
   */
  const mergeKeysFromTop = conf => entry =>
    allowedKeys.reduce(
      (e, key) =>
        !e.hasOwnProperty(key) && conf.hasOwnProperty(key)
          ? { ...e, [key]: conf[key] }
          : e,
      entry
    );

  /**
   * Set the default values in entry, if not present.
   * @param {Partial<TEntry>} entry The entry to fill with defaults
   * @returns {Partial<TEntry>} The entry with the default values filled.
   */
  const setDefaults = entry =>
    allowedKeys.reduce(
      (e, key) =>
        !e.hasOwnProperty(key) && description[key].hasOwnProperty("default")
          ? { ...e, [key]: description[key].default }
          : e,
      entry
    );

  /**
   * Checks whether an entry has all the required keys, or throws error.
   * @param {Partial<TEntry>} entry The entry for which the defaults must be filled.
   * @param {number} i The 0-based index of this entry
   * @returns {TEntry} A full entry
   */
  const checkRequiredKeys = (entry, i) => {
    const missingKeys = allowedKeys.filter(
      name => description[name].required && !entry.hasOwnProperty(name)
    );
    if (missingKeys.length > 0) {
      throw new Error(
        `Entry ${i + 1} (name: ${
          entry.name
        }) is missing keys ${missingKeys.join(", ")}`
      );
    }
    return entry;
  };

  /**
   * Get a list of full entries from a configuration.
   * @param {Configuration<TEntry>} conf The configuration to process
   * @returns {TEntry[]} An array of entries extracted from the configuration.
   */
  const getEntries = conf =>
    conf.entries
      .map(mergeKeysFromTop(conf))
      .map(setDefaults)
      .map(checkRequiredKeys);

  return getEntries;
};
