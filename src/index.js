const { promiseSerial } = require("./promise-serial");
const { logMonad } = require("./logging");
const { conf } = require("./parseargs");
const { getEntries } = require("./entries");
const { runSingle } = require("./process");

Promise.resolve()
  .then(logMonad(">>> Starting!"))
  .then(() =>
    promiseSerial(getEntries(conf).map(entry => () => runSingle(entry)))
  )
  .then(logMonad(">>> Finished."));
