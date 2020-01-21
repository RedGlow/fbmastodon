const Masto = require("mastodon");

/**
 * Map between mastodon access token and Mastodon objects.
 *
 * @type {Object.<string,import("mastodon")>}
 */
let mastos = {};

/**
 * Get a mastodon object from a mastodon access token, caching multiple istances.
 *
 * @param {string} mastodonServerUrl    The URL of the Mastodon server
 * @param {string} mastodonAccessToken  The Mastodon access token.
 * @returns {import("mastodon")}  The Mastodon object.
 */
const getMasto = (mastodonServerUrl, mastodonAccessToken) => {
  mastos[mastodonAccessToken] =
    mastos[mastodonAccessToken] ||
    new Masto({
      access_token: mastodonAccessToken,
      api_url: `${mastodonServerUrl}/api/v1/`
    });
  return mastos[mastodonAccessToken];
};

/**
 * Post a new media.
 * @callback PostMedia
 * @param {import("fs").ReadStream} imageStream A stream containing a media to post
 * @returns {Promise<{data: {id: string}}>}  The result of the operation
 */

/**
 * Post a new status
 * @callback PostStatus
 * @param {string} message  The text content of the status to post
 * @param {string[]} mediaIds The IDs of all the media to post
 * @returns {Promise<{data: {id: string}}>} The data regarding the new status
 */

/**
 * @typedef {Object} MastodonInterface
 * @property {PostMedia} postMedia
 * @property {PostStatus} postStatus
 */

/**
 * Get the Mastodon interface.
 * @param {string} mastodonServerUrl    The URL of the Mastodon server
 * @param {string} mastodonAccessToken The Mastodon access token
 * @returns {MastodonInterface} The mastodon interface
 */
exports.getMastodonInterface = (mastodonServerUrl, mastodonAccessToken) => {
  const m = getMasto(mastodonServerUrl, mastodonAccessToken);

  return {
    postMedia: imageStream => m.post("media", { file: imageStream }),

    postStatus: (message, mediaIds) =>
      m.post("statuses", {
        status: message || "",
        media_ids: mediaIds
      })
  };
};
