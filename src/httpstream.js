const https = require("https");
const http = require("http");

/**
 * Returns a stream from an URL
 * @param {string} url  The URL to download
 * @returns {import("fs").ReadStream} A readable stream
 */
exports.getStream = url =>
  new Promise((resolve, reject) =>
    (url.indexOf("https") === 0 ? https : http).get(url, res =>
      res.statusCode === 200 ? resolve(res) : reject("ERROR")
    )
  );
