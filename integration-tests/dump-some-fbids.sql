PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE posts (
  facebookPostId TEXT PRIMARY KEY,
  pageId TEXT,
  mastodonPostId TEXT,
  mastodonServerUrl TEXT
);
INSERT INTO posts VALUES('10','0','0','0');
INSERT INTO posts VALUES('20','0','0','0');
COMMIT;
