
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var geolocate = require('ip-geolocate');
var ip;

var addressValidator = require('address-validator');
addressValidator.setOptions({ key: 'AIzaSyAP0ZPfHRURoWicse4fzfvGhbQTo8ALok0' });

var _ = require('lodash');

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
  if (config.app.useIpService) {
    rp.get('https://api.ipify.org')
      .then(function (response) {
        geolocate.getLocation(response, function (err, location) {
          if (err) {
            // Error occurred, latency threshold hit, or IP address is invalid 
            console.log(err);
            res.send(err);
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
  } else {
    geolocate.getLocation(ip, function (err, location) {
      if (err) {
        // Error occurred, latency threshold hit, or IP address is invalid 
        console.log(err);
        res.send(err);
      }
      else {
        // Success 
        console.log(location);
        res.send(location);
      }
    });
  }
}

function getProvisionedAddress(req, res, next) {
  console.log(`Looking for the provisioned address ${req.params.phone}.`);
  db.findOne({ 'phone': req.params.phone }, function (err, doc) {
    res.send(err || doc);
  });
}

function provisionAddress(req, res, next) {
  var address = req.body;
  console.log(`Provisioning ${address} for ${address.phone}.`);
  validateAddress(address, function (err, response) {
    if (err) {
      res.send(err);
    } else {
      response.phone = req.params.phone;
      db.insert(response, function (err, newDoc) {
        res.send(err || newDoc);
      });
    }
  });
}

function validateAddress(address, cb) {
  var addr = new addressValidator.Address(address);
  addressValidator.validate(addr, function (err, exact, inexact, response) {
    if (!err) {
      // TODO: We need to coerce the response into a functional address.
      cb(err, formatGeoResponse(response.results[0]));
    }
  });

  function formatGeoResponse(geores) {
    var types = {
      country: "country",
      state: "administrative_area_level_1",
      county: "administrative_area_level_2",
      city: "locality",
      street: "route",
      number: "street_number",
      postal_code: "postal_code"
    };
    var outp = {
      singleline: geores.formatted_address,
      lat: geores.geometry.location.lat,
      lng: geores.geometry.location.lng,
      place_id: geores.place_id
    };

    return _.mapValues(
      _.merge(outp, _.mapValues(types, function (v) { return _.find(geores.address_components, { types: [v] }) })),
      function (v) {
        return v && (v.short_name || v);
      }
    );
  }
}
