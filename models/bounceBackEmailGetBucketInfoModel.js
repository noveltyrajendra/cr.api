let bounceBackEmailGetBucketInfoModel = function (cdata) {
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list = [];
  let collegeSeo = "";
  let college_details = [];

  cdata.forEach(function(obj) {
    if(obj.seo_name) {
      collegeSeo = obj.seo_name;
    }else{
      collegeSeo = obj.college_name;
    }
    if(obj.id) {
      college_details.push({
        college_id: obj.id,
        college_name: obj.college_name,
        collegeAlias: obj.college_alias,
        collegeUrl: stringUtil.collegeNameUrl(collegeSeo)
      })
    }
  })

  return college_details;
  // console.log("LIST", list);
      // cdata.forEach(function (obj) {
      //   if(obj.seo_name){
      //     collegeSeo = obj.seo_name;
      //   }else{
      //     collegeSeo = obj.college_name;
      //   }
      //   if(obj.id) {
      //     college_details.push({
      //       college_id: obj.id,
      //       college_name: obj.college_name,
      //       collegeUrl: stringUtil.collegeNameUrl(collegeSeo)
      //     });
      //   }

      // cdata.forEach(function (obj) {
      //   if(obj.seo_name){
      //     collegeSeo = obj.seo_name;
      //   }else{
      //     collegeSeo = obj.college_name;
      //   }
      //   if(obj.id) {
      //     college_details.push({
      //       college_id: obj.id,
      //       college_name: obj.college_name,
      //       collegeUrl: stringUtil.collegeNameUrl(collegeSeo)
      //     });
      //   }
      // })
      // return college_details;
  // });
      // if(college_details.length>0) {
      //   list.push(college_details);
      // }

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
  // return list;
};

module.exports = bounceBackEmailGetBucketInfoModel;