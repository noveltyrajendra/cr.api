const { authenticate } = require('./authenticate-middleware');
const { authorize } = require('./authorize-middleware');
const { validateSsoClient } = require('./sso-client-validation');

module.exports = { authenticate, authorize, validateSsoClient };
