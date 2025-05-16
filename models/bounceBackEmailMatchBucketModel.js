let bounceBackEmailBucketModel = function (src) {
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list = [];
    let collegeSeo = "";
    // let matchPercent = 73;
    src.forEach(function (obj) {

      if(obj.seo_name){
        collegeSeo = obj.seo_name;
      }else{
        collegeSeo = obj.college_name;
      }

      if (list.findIndex(x => x.collegeId == obj.collegeId) < 0) {
        list.push({
          collegeId: obj.college_id,
          college_name: obj.college_name,
          collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
        });
      }
  
    });
  
  
    /*if (list.length > 5) {
      orderList = list.splice(0, 5);
      let randomList = stringUtil.get_random(list);
      finalList = [...orderList, ...randomList];
    } else {
      finalList = list;
    }*/

    
        // To sort the college list based on access level and put 2 partner school at top

    // if(list.length > 2) {
    //     orderList = list.sort(stringUtil.compareValues('accessLevel'));
    //     partnerList = orderList.slice(0,2);
    //     finalList = [...new Set([...partnerList, ...list])];
    // } else {
    //     finalList = list;
    // }
    return list;
  };
  
  module.exports = bounceBackEmailBucketModel;