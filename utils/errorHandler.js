var errorConstants = require('../constants/errorConstants');

const errorHandler = function (error, res) {
  try {
    if (error) {
      switch (error.status) {
        case 500:
          res.status(error.statusCode || 500).send({
            code: error.statusCode || 500,
            message: error.message,
          });
          break;

        case 503:
          res.status(error.statusCode || 503).send({
            code: error.statusCode || 503,
            message: error.message,
          });
          break;
        case 504:
          res.status(error.statusCode || 504).send({
            code: error.statusCode || 504,
            message: error.message,
          });
          break;

        case 404:
          res
            .status(error.statusCode || 404)
            .send({ code: error.statusCode || 404, message: error.message });
          break;

        default:
          res
            .status(error.statusCode || 500)
            .send({ code: error.statusCode || 500, message: error.message });
      }
    } else {
      console.log(errorConstants);
      res.status(error.statusCode || 500).send({
        code: error.statusCode || 500,
        message: error.message,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

const errorWithCode = (message, statusCode) => {
  let error = new Error(message);
  Object.assign(error, { statusCode });
  return error;
};

module.exports = {
  errorHandler,
  errorWithCode,
};
