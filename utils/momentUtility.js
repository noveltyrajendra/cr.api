const moment = require('moment');

const getCurrentDateInFormat = (format = undefined) => {
  return moment(new Date()).format(format);
};

const convertDateToSpecificFormat = (date, format = 'MM/DD/YYYY') => {
  return moment(date).format(format);
};

module.exports = {
  getCurrentDateInFormat,
  convertDateToSpecificFormat,
};
