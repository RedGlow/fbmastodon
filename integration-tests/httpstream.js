const http = require("http");
const https = require("https");
const { join } = require("path");
const express = require("express");
const { readFileSync } = require("fs");

const { test } = require("../spec-helpers/tape");
const { getStream } = require("../src/httpstream");

/*
commands used to produce the https files:
openssl req -new -x509 -days 9999 -config httpstream.ca.cnf -keyout httpstream.ca-key.pem -out httpstream.ca-crt.pem
openssl genrsa -out httpstream.server-key.pem 4096
openssl req -new -config httpstream.server.cnf -key httpstream.server-key.pem -out httpstream.server-csr.pem
openssl x509 -req -extfile httpstream.server.cnf -days 999 -passin "pass:password" -in httpstream.server-csr.pem -CA httpstream.ca-crt.pem -CAkey httpstream.ca-key.pem -CAcreateserial -out httpstream.server-crt.pem
*/

const getHttpServer = (dirname, useHttps) =>
  new Promise(resolve => {
    const app = express();
    app.use(express.static(join(__dirname, dirname)));
    const server = (useHttps ? https : http)
      .createServer(
        useHttps
          ? {
              key: readFileSync(join(__dirname, "httpstream.server-key.pem")),
              cert: readFileSync(join(__dirname, "httpstream.server-crt.pem")),
              ca: readFileSync(join(__dirname, "httpstream.ca-crt.pem")),
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
          stop: () => server.close()
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
  const root = "httpstream.root";
  const { url, stop } = await getHttpServer(root, useHttps);
  try {
    const stream = await getStream(
      useHttps
        ? {
            ca: (https.globalAgent.options.ca || []).concat([
              readFileSync(join(__dirname, "httpstream.server-crt.pem"))
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
    stop();
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
