/**
 * @param {(line: string) => void} logFunction The log function.
 */
exports.getLoggingSystem = logFunction => {
  const loggingSystem = {
    /**
     * Logs a message in a chain stream of monads. Used especially with promises like this:
     * ```
     * getAllPosts()
     *   .then(logMonad(posts => `Returned ${posts.length} posts!`))
     *   .then(posts => "process posts here");
     * ```
     * The argument can be either a string to log, or a function that takes the data and
     * returns the string to log.
     * @type {<T>(fn: (data: T) => string | string) => (data: T) => T}
     */
    logMonad: fn => data => {
      logFunction(typeof fn === "function" ? fn(data) : fn);
      return data;
    },

    /**
     * Logs a message starting from a data object. Used especially with fluent interfaces like this:
     * ```
     * logContent(
     *   getArray().filter(...),
     *   arr => `Only ${arr.length} elements after filter`)
     * .reverse()
     * .map(...);
     * ```
     * The last argument follows the same logic as `logMonad`.
     * @template T
     * @param {T} data  The data to analyse and return
     * @param {(data: T) => string} fn The logging function
     * @returns {T} The input data
     */
    logContent: (data, fn) => loggingSystem.logMonad(fn)(data)
  };
  return loggingSystem;
};
