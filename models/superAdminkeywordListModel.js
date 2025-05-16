let superAdminkeywordListModel = function(src){
	let config = require('../config');
  let list=[];
  
	src.forEach(function(obj)
	{	
		list.push({
      id: obj.id,
      name: obj.name,
      type : obj.type,
			displayText: obj.display_text,
			action: obj.action
		});
			
	});
	return list;
};

module.exports = superAdminkeywordListModel;