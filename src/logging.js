/*
 * @template T
 * @param {(data: T) => string | string} fn A function which gets the data to examine and produces a debug string, or directly the string
 * @returns {(data: T) => T} The logging function, an identity function
 */
/**
 * Logs a message in a chain stream of monads. Used especially with promises like this:
 * ```
 * getAllPosts()
 *   .then(logMonad(posts => `Returned ${posts.length} posts!`))
 *   .then(posts => "process posts here");
 * ```
 * @type {<T>(fn: (data: T) => string) => (data: T) => T}
 */
exports.logMonad = fn => data => {
  console.log(typeof fn === "function" ? fn(data) : fn);
  return data;
};

/**
 * Logs a message starting from a data object. Used especially with fluent interfaces like this:
 * ```
 * logContent(
 *   getArray().filter(...),
 *   arr => `Only ${arr.length} elements after filter`)
 * .reverse()
 * .map(...);
 * ```
 * @template T
 * @param {T} data  The data to analyse and return
 * @param {(data: T) => string} fn The logging function
 * @returns {T} The input data
 */
exports.logContent = (data, fn) => exports.logMonad(fn)(data);
