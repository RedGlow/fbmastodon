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

exports.getInsertStatement = ids => `INSERT INTO
  posts (facebookPostId, mastodonPostId)
VALUES
  ${ids
    .map(
      ({ facebookPostId, mastodonPostId }) =>
        `('${facebookPostId}', '${mastodonPostId}')`
    )
    .join(",\n  ")};`;
