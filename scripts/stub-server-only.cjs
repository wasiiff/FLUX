// Test-only: short-circuit the `server-only` package so we can run pipeline
// tests with tsx outside the Next.js bundler.
const Module = require("node:module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === "server-only") {
    return require.resolve("./empty.cjs");
  }
  return orig.call(this, request, parent, ...rest);
};
