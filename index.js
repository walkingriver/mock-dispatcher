
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var geolocate = require('ip-geolocate');
var ip;

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));

server.use(function (req, res, next) {
  ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  console.log(`Got request from ${ip} for ${req.url}.`);
  next();
});

server.get('/', hello);
server.get('/location', getLocation);
server.get('/address/:phone', getProvisionedAddress);
server.post('/address', provisionAddress);

server.listen(config.port, function () {
  console.log('Listening on ', config.port);
});

function hello(req, res, next) {
  res.send('Hello - Your service is working.');
  next();
}

function getLocation(req, res, next) {
  rp.get('https://api.ipify.org')
    .then(function (response) {
      geolocate.getLocation(response, function (err, location) {
        if (err) {
          // Error occurred, latency threshold hit, or IP address is invalid 
          console.log(err);
          res.err(err);
        }
        else {
          // Success 
          console.log(location);
          res.send(location);
        }
      });
    })
    .catch(function (err) {
      // API call failed... 
      console.log('Error: ', err);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(err);
    });
}

function getProvisionedAddress(req, res, next) {
  res.send({'status': 'Not working yet.'});
}

function provisionAddress(req, res, next) {
  console.log(`Provisioning ${req.body}`);
  next();
}