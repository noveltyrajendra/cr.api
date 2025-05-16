const moment = require('moment');
const { YMDT } = require('../constants/date-time-constant');

function getCurrentDateTime() {
  return moment().utc();
}

function convertToFormat(date, format = YMDT) {
  return moment(date).format(format);
}

module.exports = { getCurrentDateTime, convertToFormat };
