let matchedCollegeListModel = function (src) {
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let truncatehtml = require('truncate-html');
    let list = [];
    var finalList = [];
    var orderList = [];
    let cimage = "";
    let collegeSeo = "";
    let overviewText = "";
    // let matchPercent = 73;
    src.forEach(function (obj) {
      if (obj.college_logo == "") {
        cimage = "no-college.png";
      } else {
        cimage = obj.college_logo;
      }

      if(obj.seo_name){
        collegeSeo = obj.seo_name;
      }else{
        collegeSeo = obj.college_name;
      }

      overviewText = truncatehtml(obj.overview, 300, { stripTags: true });

      if (list.findIndex(x => x.collegeId == obj.collegeId) < 0) {
        list.push({
          collegeId: obj.collegeId,
          college_name: obj.college_name,
          collegeAlias: obj.college_alias,
          percentMatch: obj.matched_percent,
          collegeDesc: overviewText,
          collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
          accessLevel: obj.access_level,
          collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + cimage
        });
      }
  
    });
  
    orderList = list.sort((a, b) => parseInt(b.percentMatch) - parseInt(a.percentMatch));
    return orderList;
  };
  
  module.exports = matchedCollegeListModel;