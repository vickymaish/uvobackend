const path = require('path');

module.exports = function override(config) {
  // Add fallbacks only for required modules
  config.resolve.fallback = {
    "path": require.resolve("path-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "stream": require.resolve("stream-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "assert": require.resolve("assert/"),
  };

  // Add aliases if needed
  config.resolve.alias = {
    ...config.resolve.alias,
    "util": require.resolve("util/"),
  };

  return config;
};
