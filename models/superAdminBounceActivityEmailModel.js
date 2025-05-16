let superAdminBounceActivityEmailModel = function(src){
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list=[];
    
      src.forEach(function(obj)
      {	
        list.push({
            year:obj.year,
            month: obj.month,
            sentTotal: parseInt(obj.stotal)? parseInt(obj.stotal):0,
            openTotal: parseInt(obj.ototal)?parseInt(obj.ototal):0,
            clickTotal: parseInt(obj.ctotal)?parseInt(obj.ctotal):0,
            bounceTotal: parseInt(obj.btotal)?parseInt(obj.btotal):0,
            openRate: parseInt(obj.orate)?parseInt(obj.orate):0,
            clickRate: parseInt(obj.crate)?parseInt(obj.crate):0,
            matchTotal: parseInt(obj.mtotal)?parseInt(obj.mtotal):0,
            featureTotal: parseInt(obj.ftotal)?parseInt(obj.ftotal):0,
            unsubTotal: parseInt(obj.unsubtotal)?parseInt(obj.unsubtotal):0,
            unsubRate: parseInt(obj.unsubrate)?parseInt(obj.unsubrate):0,
        });
              
      });
      return list;
  };
  
  module.exports = superAdminBounceActivityEmailModel;