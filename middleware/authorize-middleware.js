const { errorWithCode } = require('../utils/errorHandler');

const authorize =
  (...role) =>
  (req, _, next) => {
    const user = req['user'];
    if (!role.includes(user.role)) throw errorWithCode('Unauthorized', 403);
    next();
  };

module.exports = {
  authorize,
};
