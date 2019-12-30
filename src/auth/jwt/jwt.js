const fs = require('fs');
const jwt = require('jsonwebtoken');
const jwtPrivateKey = `src/auth/jwt/private-key.pem`;
const jwtPublicKey = `src/auth/jwt/public-key.pem`;

module.exports.generateToken = async(payload) => {
  const token = await  jwtSign(payload);
  return token;
};

module.exports.verifyToken = async(token) => {
  const result = await jwtVerify(token);
  return result;
};

module.exports.getPayloadFromToken = async(token) => {
  const payload = await jwtVerify(token);
  return payload;
};

const jwtSign = (payload) => {
  const options = {
    algorithm: 'RS256',
    expiresIn: '100000 days'
  }
  return new Promise((resolve, reject) => {
    try {
      const cert = fs.readFileSync(jwtPrivateKey);
      const token = jwt.sign(payload, cert, options);
      resolve(token);
    } catch (err) {
      reject(err);
    }
  })
}

const jwtVerify = (token) => {
  const options = {
    algorithms: ['RS256']
  }
  return new Promise((resolve, reject) => {
    try {
      const cert = fs.readFileSync(jwtPublicKey);
      const result = jwt.verify(token, cert, options);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  })
}
