TYPE_ETS = 'ets';
REQUIRED_PARAMETERS = [
  'firstName',
  'lastName',
  'zipCode',
  'email',
  'educationGoal',
  'areaOfStudy',
  'areaOfFocus',
  'state',
  'clientId',
  'secretKey',
  'militaryStatus',
  'branchService',
];
// Prepared statements
const SSO_LOGIN_LOG = 'INSERT INTO sso_login_log SET ?';
const SPECIFIC_BB_BUCKETS = [4, 6, 8, 10, 11, 12, 13, 17, 18, 19];
const REGISTER_SOURCE = 'signup';
const PRIMARY_SOURCE = 'sso';
const SECONDARY_SOURCE = 'ets';

module.exports = {
  TYPE_ETS,
  SSO_LOGIN_LOG,
  REQUIRED_PARAMETERS,
  SPECIFIC_BB_BUCKETS,
  REGISTER_SOURCE,
  PRIMARY_SOURCE,
  SECONDARY_SOURCE,
};
