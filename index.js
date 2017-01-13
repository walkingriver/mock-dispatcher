
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var geolocate = require('ip-geolocate');
var ip;

// Persistent datastore with automatic loading
var Datastore = require('nedb')
  , db = new Datastore({ filename: config.app.data, autoload: true });

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: true }));

server.use(function (req, res, next) {
  ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  console.log(`Got request from ${ip} for ${req.url}.`);
  next();
});

server.get('/', hello);
server.get('/location', getLocation);
server.get('/address/:phone', getProvisionedAddress);
server.post('/address/:phone', provisionAddress);

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
  console.log(`Looking for the provisioned address ${req.params.phone}.`);
  db.findOne({'phone': req.params.phone}, function(err, doc) {
    res.send (err || doc);
  });
}

function provisionAddress(req, res, next) {
  var address = req.body;
  console.log(`Provisioning ${address} for ${address.phone}.`);
  address.phone = req.params.phone;
  db.insert(address, function (err, newDoc) {
    res.send(err || newDoc);
  });
}