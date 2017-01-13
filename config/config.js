var path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'mockDispatcher',
      data: path.join(rootPath, 'data-dev')
    },
    port: process.env.PORT || 3000,
  },

  test: {
    root: rootPath,
    app: {
      name: 'mockDispatcher',
      data: path.join(rootPath, 'data-test')
    },
    port: process.env.PORT || 3000,
  },

  production: {
    root: rootPath,
    app: {
      name: 'mockDispatcher',
      data: path.join(rootPath, 'data')
    },
    port: process.env.PORT || 3000,
  }
};

module.exports = config[env];
