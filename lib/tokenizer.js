const jwt = require('jsonwebtoken')
const CONFIG = require('../config.json')

module.exports.generate_token = (payload) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, CONFIG.secret, (err, token) => {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
}

module.exports.verify_token = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, CONFIG.secret, (err, payload) => {
      if (err) {
        return reject(err);
      }
      resolve(payload);
    })
  })
}