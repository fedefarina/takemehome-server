"use strict";
var Q = require('q');
var pg = require('pg');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config');
var geolib = require('geolib');

function UserService() {
  this.createUserFromResult = function (data, withPhoto) {

    var user = {
      id: data.id,
      age: data.age,
      name: data.name,
      alias: data.alias,
      email: data.email,
      gender: data.gender,
      photo_profile: 'users/' + data.id + '/photo',
      location: {
        latitude: data.latitude,
        longitude: data.longitude
      }
    };

    if (withPhoto) {
      user.photo_profile = encodeURI(data.photo_profile.toString());
    }

    return user;
  };
}

UserService.prototype.get = function (userId, next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT * FROM users WHERE id = ($1)", [userId]);
    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      done();
      if (result.rowCount) {
        var data = result.rows[0];
        data.photo_profile = data.photo_profile.toString();
        next(null, data);
      } else {
        next({message: "User not found in the database"});
      }
    });
  });
};

UserService.prototype.create = function (data, next) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var encryptedPassword = utils.encryptPassword(data.password);
    var photo_profile_base64 = data.photo_profile ? data.photo_profile.replace(/ /g, '+') : null;
    client.query("SELECT * FROM users WHERE alias = ($1)", [data.username], function (err, result) {
      if (result.rowCount) {
        done();
        next({message: "Username already taken"}, null);
      } else {
        var user = [data.name, data.username, encryptedPassword, data.email, data.gender, data.age
          , data.latitude, data.longitude, photo_profile_base64];

        //Create user
        client.query("INSERT INTO users(name, alias, password, email, gender, age, latitude, longitude, photo_profile)" +
        " values($1, $2, $3, $4, $5, $6, $7, $8, $9)", user, function (err, result) {
          done();
          if (err) {
            console.log(err);
            next(err);
          } else {
            next(null, {});
          }
        });
      }

    });
  });
};

UserService.prototype.getAll = function (next) {
  var that = this;
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    var query = client.query("SELECT id,name,alias,email,gender,age,latitude,longitude FROM users ORDER BY id ASC;");
    // Stream results back one row at a time
    query.on('row', function (row, result) {
      result.addRow(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', function (result) {
      done();
      var jsonObject = {"users": [], metadata: {version: 0.1, count: result.rowCount}};
      _.each(result.rows, function (user) {
        jsonObject.users.push(that.createUserFromResult(user, false));
      });

      next(null, jsonObject);
    });
  });
};

UserService.prototype.getProfilePhoto = function (userId, next) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("SELECT * FROM users WHERE id = ($1)", [userId], function (err, result) {
      done();
      if (err) {
        console.log(err);
        next(err);
      } else {
        next(null, {photo_profile: encodeURI(result.rows[0].photo_profile.toString())});
      }
    });
  });
};

UserService.prototype.getProfile = function (alias, next) {
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("SELECT * FROM users WHERE alias = ($1)", [alias], function (err, result) {
      done();

      if (err) {
        console.log(err);
        next(err);
      } else if (!result.rowCount) {
        next({message: "No profile found for alias: " + alias});
      } else {

        var user = result.rows[0];
        //Return photo profile as base64 string instead bytea default
        if (user.photo_profile) {
          user.photo_profile = encodeURI(user.photo_profile.toString());
        }
        next(null, user);
      }
    });
  });
};

UserService.prototype.update = function (userId, data, next) {
  var updateQuery = [];

  var keys = Object.keys(data);

  data.photo_profile = data["photo_profile"] ? data.photo_profile.replace(/ /g, '+') : null;

  for (var i = 0; i < keys.length; i++) {
    updateQuery[i] = " " + keys[i] + " = '" + data[keys[i]] + "'";
  }

  updateQuery = updateQuery.join();

  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("UPDATE users SET" + updateQuery + " WHERE id = ($1)", [userId], function (err, result) {
      done();
      if (err) {
        next(err);
        console.log(err);
      } else {
        next(null, {});
      }
    });
  });
};

UserService.prototype.delete = function (userId, next) {
  //fixme do this in a transaction https://github.com/brianc/node-postgres/wiki/Transactions
  pg.connect(config.DATABASE_URL, function (err, client, done) {
    client.query("DELETE FROM users WHERE id = ($1)", [userId], function (err, result) {
      done();
      if (err) {
        console.log(err);
        next(err);
      } else {
        next(null, {});
      }
    });
  });
};

exports = module.exports = function () {
  return new UserService();
};
