let collegeFrequencyReportModel = function (src) {
    let config = require('../config');
    let list = [];
  
    src.forEach(function (obj) {
      list.push({
        name: obj.name+' - '+obj.value+"%",
        value: obj.value,
      });
  
    });
    return list;
  };
  
  module.exports = collegeFrequencyReportModel;