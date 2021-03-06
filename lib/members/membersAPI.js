'use strict';

var conf = require('nconf');
var store = conf.get('beans').get('memberstore');

module.exports = {
  isValidNickname: function (nickname, callback) {
    var trimmedNick = nickname.trim();
    if (this.isReserved(trimmedNick)) {
      return callback(null, false);
    }
    store.getMember(trimmedNick, function (err, result) {
      if (err) { return callback(err); }
      callback(null, !result);
    });
  },

  isValidEmail: function (email, callback) {
    store.getMemberForEMail(email.trim(), function (err, result) {
      if (err) { return callback(err); }
      callback(null, !result);
    });
  },

  isReserved: function (nickname) {
    return new RegExp('^edit$|^new$|^checknickname$|^submit$|^administration$|^[.][.]$|^[.]$|\\+', 'i').test(nickname);
  }
};

