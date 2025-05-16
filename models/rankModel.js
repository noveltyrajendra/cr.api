let rankModel = function(src){
  
    var list=[];
    src.forEach(function(obj)
    {	
      list.push({
        rankId:obj.id,
        shortName:obj.name
      });
  
    });
    return list;
  };
  
  module.exports = rankModel;