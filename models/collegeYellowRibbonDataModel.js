let collegeYellowRibbonDataModel = function (src) {
    let config = require('../config');
    let list = [];
  
    src.forEach(function (obj) {
      list.push({
        degreelevel: obj.degree_name,
        divisonschool: obj.division_of_school,
        number: obj.no_of_student,
        amount: obj.amount
      });
  
    });
    return list;
  };
  
  module.exports = collegeYellowRibbonDataModel;