let savedCollegeWithFilterModel = function (fdata,sdata) {
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list = [];
    let finalList = [];
    let dupList = [];
  
    fdata.forEach(function(obj) {
      if(obj.collegeId) {
        list.push({
          collegeId: obj.collegeId,
          collegeName: obj.collegeName,
          collegeAlias: obj.collegeAlias,
          collegeContact: obj.collegeContact,
          contacted: obj.contacted,
          savedSchool: "no",
          collegeUrl: obj.collegeUrl,
          isSpecificDegree: obj.isSpecificDegree,
          specificProfileId: obj.specificProfileId,
          parentCollegeId: obj.parentCollegeId
        })
      }
    })
    //finalList = [...new Set([...sdata, ...list])];
    dupList = [...list,...sdata];
    finalList = [...new Map(dupList.map(item => [item['collegeId'], item])).values()];
    return finalList.sort(stringUtil.compareValues('savedSchool','desc'));;
  };
  
  module.exports = savedCollegeWithFilterModel;