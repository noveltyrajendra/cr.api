const {
  sign: signJWT,
  decode: decodeJWT,
  verify: verifyJWT,
} = require('jsonwebtoken');
const { readFileSync } = require('fs');

const sign = (data) =>
  signJWT(data, readFileSync('keys/cr/id_rsa.pem'), {
    expiresIn: '24h',
    algorithm: 'RS256',
  });

const decode = (token) => decodeJWT(token);

const verify = (token) => {
  try {
    return verifyJWT(token, readFileSync('keys/cr/id_rsa.pub'));
  } catch (error) {
    return false;
  }
};

module.exports = {
  sign,
  decode,
  verify,
};
