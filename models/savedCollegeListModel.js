let savedCollegeListModel = function (cdata) {
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list = [];
    let collegeSeo = "";
  
    cdata.forEach(function(obj) {
      if(obj.seo_name) {
        collegeSeo = obj.seo_name;
      }else{
        collegeSeo = obj.college_name;
      }
      if(obj.id) {
        list.push({
          collegeId: obj.id,
          collegeName: obj.college_name,
          collegeAlias: obj.college_alias,
          collegeContact: obj.contact_email,
          contacted: obj.is_contacted,
          savedSchool: "yes",
          collegeUrl: stringUtil.collegeNameUrl(collegeSeo),
          phoneRequired: obj.phone_required
        })
      }
    })
  
    return list;
  };
  
  module.exports = savedCollegeListModel;