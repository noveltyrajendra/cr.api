var basicLoginModel = function(obj){
  
    var config = require('../config');
    var adList=[];
    adList.push({
      id:obj[0].id,
      firstName:obj[0].first_name,
      lastName:obj[0].last_name,
      email:obj[0].email,
      type: obj[0].type
    });
    return adList;
  };
  
  module.exports = basicLoginModel;