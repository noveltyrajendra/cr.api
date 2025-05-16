let awardModel = function(src){
  
    var list=[];
    src.forEach(function(obj)
    {	
      list.push({
        awardId:obj.id,
        shortName:obj.award_short_name,
        fullName:obj.award_full_name
      });
  
    });
    return list;
  };
  
  module.exports = awardModel;