const { run } = require("./run");
const { logMonad } = require("./logging");

/**
 * @typedef {{facebookPostId: string, mastodonPostId: string}} Result
 */

/**
 * Log all results.
 * @param {import("./entries").Entry} entry The entry to log
 * @returns {(results: Result[]) => Result[]}
 */
const logResults = entry => results =>
  `All done for ${entry.name}!` +
  (results.length > 0
    ? "\nThe following posts have been made (Facebook post id / Mastodon post id):\n" +
      results
        .map(
          ({ facebookPostId, mastodonPostId }) =>
            `  ${facebookPostId} / ${mastodonPostId}`
        )
        .join("\n")
    : "");

/**
 * Runs the mirroring of a single entry.
 * @param {import("./entries").Entry} entry A single configuration entry
 * @returns {Promise<Result>} The result of the mirroring operation
 */
exports.runSingle = entry =>
  Promise.resolve()
    .then(logMonad(() => `> Running ${entry.name}`))
    .then(() => run(entry))
    .then(logMonad(logResults(entry)));
