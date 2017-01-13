var path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'mockDispatcher',
      data: path.join(rootPath, 'data-dev'),
      useIpService: true
    },
    port: process.env.PORT || 3000,
  },

  test: {
    root: rootPath,
    app: {
      name: 'mockDispatcher',
      data: path.join(rootPath, 'data-test'),
      useIpService: true
    },
    port: process.env.PORT || 3000,
  },

  production: {
    root: rootPath,
    app: {
      name: 'mockDispatcher',
      data: path.join(rootPath, 'data'),
      useIpService: false
    },
    port: process.env.PORT || 3000,
  }
};

module.exports = config[env];
