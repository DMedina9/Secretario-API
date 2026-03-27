const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  config.resolver.assetExts.push('pdf');

  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    url: require.resolve('url'),
    stream: require.resolve('stream-browserify'),
    path: require.resolve('path-browserify'),
    buffer: require.resolve('buffer'),
    events: require.resolve('events'),
    process: require.resolve('process/browser'),
    util: require.resolve('util'),
    os: require.resolve('os-browserify'),
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    vm: require.resolve('vm-browserify'),
    fs: path.resolve(__dirname, 'src/services/mock.js'),
    net: path.resolve(__dirname, 'src/services/mock.js'),
    tls: path.resolve(__dirname, 'src/services/mock.js'),
    'pg-hstore': path.resolve(__dirname, 'src/services/mock.js'),
    'pg-native': path.resolve(__dirname, 'src/services/mock.js'),
    pg: path.resolve(__dirname, 'src/services/mock.js'),
    mysql2: path.resolve(__dirname, 'src/services/mock.js'),
    mariadb: path.resolve(__dirname, 'src/services/mock.js'),
    tedious: path.resolve(__dirname, 'src/services/mock.js'),
    sqlite3: path.resolve(__dirname, 'src/services/mock.js'),
  };

  return config;
})();
