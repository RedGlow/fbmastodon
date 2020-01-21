exports.createStatement = `CREATE TABLE IF NOT EXISTS posts (
  facebookPostId TEXT PRIMARY KEY,
  pageId TEXT,
  mastodonPostId TEXT,
  mastodonServerUrl TEXT
);`;

exports.getExistingPosts = facebookIds =>
  `SELECT facebookPostId FROM posts WHERE facebookPostId IN (${facebookIds
    .map(id => `'${id}'`)
    .join(", ")});`;

exports.getInsertStatement = ({
  facebookPostId,
  pageId,
  mastodonPostId,
  mastodonServerUrl
}) => `INSERT INTO
  posts (facebookPostId, pageId, mastodonPostId, mastodonServerUrl)
VALUES
  ("${facebookPostId}", "${pageId}", "${mastodonPostId}", "${mastodonServerUrl}");`;
