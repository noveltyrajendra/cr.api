let collegeSpecificDegreeModel = function (src) {
    let config = require('../config');
    let list = [];
  
    src.forEach(function (obj) {
      list.push({
        id: obj.id,
        collegeId: obj.college_id,
        degreeId: obj.degreename,
        did: obj.degree_id,
        degreeDesc: obj.degree_desc,
        jobMarketReview: obj.job_market_review,
        courses: obj.courses
      });
  
    });
    return list;
  };
  
  module.exports = collegeSpecificDegreeModel;