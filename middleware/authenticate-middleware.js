const { verify } = require('../helpers/jwt-helper');
const { errorWithCode } = require('../utils/errorHandler');

const authenticate = (req, _, next) => {
  const headers = req.headers;
  const authorization = headers['Authorization'];
  if (!authorization) throw errorWithCode('Unauthorized!', 401);
  const token = header['Authorization'].replace('Bearer ', '');
  const user = verify(token);
  if (!user) throw errorWithCode('Unauthorized!', 401);
  req['user'] = user;
  next();
};

module.exports = {
  authenticate,
};
