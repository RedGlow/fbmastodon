/**
 * Runs a list of promises one after the other.
 * @template T
 * @param {Array<() => Promise<T>>} funcs Functions returning the promises to chain.
 * @returns {Promise<T[]>} All the results of the various promises.
 */
exports.promiseSerial = funcs =>
  funcs.reduce(
    (promise, func) =>
      promise.then(result => func().then(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );
