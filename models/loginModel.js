var loginModel = function(obj){
  
    var config = require('../config');
    var adList=[];
    adList.push({
      id:obj[0].id,
      uuid:obj[0].uuid,
      type:obj[0].src
    });
    return adList;
  };
  
  module.exports = loginModel;