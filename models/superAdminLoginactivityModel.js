let superAdminLoginactivityModel = function(src){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list=[];
  
	src.forEach(function(obj)
	{	
		list.push({
      date: obj.last_login?obj.last_login:"",
      type: obj.type,
      fullname: obj.fullname
		});
			
	});
	return list;
};

module.exports = superAdminLoginactivityModel;