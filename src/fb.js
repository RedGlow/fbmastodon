const fetch = require("node-fetch");

const { logMonad } = require("./logging");

/**
 * @typedef {Object} FacebookPost A facebook post
 * @property {string} id The id of this post
 * @property {string[]} imageUrls  The URLs of the attached images
 * @property {string} message The message
 */

/**
 * Get the latest posts of a page.
 *
 * @param {string} pageId ID of the page
 * @param {string} facebookAccessToken The access token to the page
 * @returns {Promise<Array<FacebookPost>>} The latest posts.
 */
exports.getPagePosts = (pageId, facebookAccessToken) =>
  Promise.resolve()
    .then(logMonad(() => "Getting FB posts..."))
    .then(() =>
      fetch(
        `https://graph.facebook.com/v5.0/${pageId}/feed?fields=id,message,attachments&access_token=${facebookAccessToken}`
      )
    )
    .then(resp => resp.json())
    .then(json =>
      json.data.map(({ id, message, attachments }) => ({
        id,
        message,
        imageUrls: attachments.data
          .filter(({ media }) => media.image)
          .map(({ media }) => media.image.src)
      }))
    )
    .then(logMonad(data => `Obtained ${data.length} posts from facebook.`));
