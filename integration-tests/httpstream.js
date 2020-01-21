const http = require("http");
const https = require("https");
const { join } = require("path");
const express = require("express");
const { readFileSync } = require("fs");

const { test } = require("../spec-helpers/tape");
const { getStream } = require("../src/httpstream");

/*
commands used to produce the https files:
cd httpstream
openssl req -new -x509 -days 9999 -config ca.cnf -keyout ca-key.pem -out ca-crt.pem
openssl genrsa -out server-key.pem 4096
openssl req -new -config server.cnf -key server-key.pem -out server-csr.pem
openssl x509 -req -extfile server.cnf -days 999 -passin "pass:password" -in server-csr.pem -CA ca-crt.pem -CAkey ca-key.pem -CAcreateserial -out server-crt.pem
*/

/**
 * @typedef {Object} ServerData
 * @property {string} url The url of the server
 * @property {() => Promise<void>} close The method to call in order to close the server
 */

/**
 * Creates a testing server
 * @param {string} dirname The directory to serve as static content
 * @param {bool} useHttps Whether to use HTTPS
 * @returns {ServerData} data to control the server
 */
const getHttpServer = (dirname, useHttps) =>
  new Promise(resolve => {
    const app = express();
    app.use(express.static(join(__dirname, dirname)));
    const server = (useHttps ? https : http)
      .createServer(
        useHttps
          ? {
              key: readFileSync(
                join(__dirname, "httpstream", "server-key.pem")
              ),
              cert: readFileSync(
                join(__dirname, "httpstream", "server-crt.pem")
              ),
              ca: readFileSync(join(__dirname, "httpstream", "ca-crt.pem")),
              requestCert: false,
              rejectUnauthorized: false
            }
          : {},
        app
      )
      .listen(0, "localhost", () =>
        resolve({
          url: `http${useHttps ? "s" : ""}://localhost:${
            server.address().port
          }`,
          stop: () =>
            new Promise((resolve, reject) =>
              server.close(err => (err ? reject(err) : resolve()))
            )
        })
      );
  });

const streamToString = stream => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

const fileTest = (fname, useHttps = false) => async t => {
  const root = "httpstream/root";
  const { url, stop } = await getHttpServer(root, useHttps);
  try {
    const stream = await getStream(
      useHttps
        ? {
            ca: (https.globalAgent.options.ca || []).concat([
              readFileSync(join(__dirname, "httpstream", "server-crt.pem"))
            ])
          }
        : {}
    )(`${url}/${fname}`);
    const str = await streamToString(stream);
    t.deepEqual(
      str,
      readFileSync(join(__dirname, root, fname), { encoding: "utf8" })
    );
  } finally {
    await stop();
  }
};

test("HttpStream: get a short stream from a given URL", fileTest("file.txt"));

test(
  "HttpStream: get a long stream from a given URL",
  fileTest("divina-commedia.txt")
);

test(
  "HttpStream: get a short stream from a given URL using HTTPS",
  fileTest("file.txt", true)
);

test(
  "HttpStream: get a short stream from a given URL using HTTPS",
  fileTest("divina-commedia.txt", true)
);
