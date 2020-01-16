const { logMonad, logContent } = require("./logging");
const { getStream } = require("./httpstream");
const { getMastodonInterface } = require("./mastodon");
const { getDbInterface } = require("./db");
const { getPagePosts } = require("./fb");
const { promiseSerial } = require("./promise-serial");

/**
 * Adds a facebook post to Mastodon.
 * @param {import("./fb").FacebookPost} fbPost The facebook post
 * @param {import("./mastodon").MastodonInterface} param1 The mastodon interface
 * @returns {Promise<{facebookPostId: string, mastodonPostId: string}>} IDs of the original facebook
 *   post and the mastodon post just done
 */
const addFbPost = (fbPost, { postMedia, postStatus }) =>
  Promise.resolve()
    .then(logMonad(() => `Adding FB post ${fbPost.id}`))
    .then(() =>
      Promise.all(fbPost.imageUrls.map(imageUrl => getStream(imageUrl)))
    )
    .then(imageStreams => {
      return Promise.all(imageStreams.map(m => postMedia(m))).then(mediaResps =>
        postStatus(
          fbPost.message,
          mediaResps.map(mediaResp => [mediaResp.data.id])
        )
          .then(({ data }) => ({
            facebookPostId: fbPost.id,
            mastodonPostId: data.id
          }))
          .then(logMonad(e => `Added Mastodon post ${e.mastodonPostId}`))
      );
    });

/**
 * Performs an import run. Needs data about:
 * - facebook page id of the page to import
 * - facebook and mastodon access tokens
 * - db location and name of the sqlite3 db that contains the mapping of the already imported facebook posts and mastodon posts.
 *
 * @param {string} dbLocation Directory of the database
 * @param {string} dbName Filename of the database
 * @param {string} mastodonServerUrl    The URL of the Mastodon server
 * @param {string} mastodonAccessToken The Mastodon access token
 * @param {string} pageId ID of the page
 * @param {string} facebookAccessToken The access token to the page
 */
exports.run = ({
  dbLocation,
  dbName,
  mastodonServerUrl,
  mastodonAccessToken,
  pageId,
  facebookAccessToken
}) => {
  const { getExistingIds, addIds } = getDbInterface(dbLocation, dbName);
  const mastodonInterface = getMastodonInterface(
    mastodonServerUrl,
    mastodonAccessToken
  );
  return getPagePosts(pageId, facebookAccessToken)
    .then(posts =>
      getExistingIds(posts.map(({ id }) => id)).then(existingIds =>
        promiseSerial(
          logContent(
            posts.filter(post => existingIds.indexOf(post.id) < 0),
            data => `${data.length} posts have not been previously added.`
          )
            .reverse()
            .map(fbPost => () =>
              addFbPost(fbPost, mastodonAccessToken, mastodonInterface)
            )
        )
      )
    )
    .then(ids => addIds(ids).then(() => ids));
};
