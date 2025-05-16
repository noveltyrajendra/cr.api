const { findOne } = require('../helpers/mysql-helper');
const { DB_TABLE } = require('../constants/table-constant');
const { errorWithCode } = require('../utils/errorHandler');

const validateSsoClient = async (req, res, next) => {
  try {
    // console.log('headers', req.headers)
    if (!req.headers) throw errorWithCode('Unauthorized!', 401);
    const secretKey = req.headers['secretkey'];
    const clientId = req.headers['clientid'];
    // console.log('secretKey',secretKey)
    // console.log('clientId',clientId)
    if(!secretKey || !clientId) throw errorWithCode('Unauthorized!', 401);

    const isTokenValid = await findOne(
      DB_TABLE.SSO_CLIENT,
      {
        client_id: clientId,
        secret_key: secretKey,
      },
      ['client_id']
    );
      //console.log('isTokenValid',isTokenValid)
    if (!isTokenValid || !isTokenValid.length)
      throw errorWithCode('Unauthorized!', 401);

    next();

  } catch (error) {
    // return errorWithCode(
    //   error.message,
    //   error.statusCode ? error.statusCode : null
    // );
    res
    .status(error.statusCode)
    .json({
      message: error.message,
      statusCode: error.statusCode ? error.statusCode : null
    })
  }
}

module.exports = { validateSsoClient }