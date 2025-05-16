let academicInterestModel = function(src){
  
  let config = require('../config');
  let majorList=[];
    src.forEach(function(obj)
    {	
      majorList.push({
        id:obj.id,
        major:obj.major,
        description:obj.description
      });
  
    });
    return majorList;
  };
  
  module.exports = academicInterestModel;