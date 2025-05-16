let superAdminVeteranModel = function(src){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list=[];
  
	src.forEach(function(obj)
	{	
    let studentName = obj.first_name+(obj.middle_initial? ' '+obj.middle_initial:'')+' '+obj.last_name;
		list.push({
      id: obj.uuid,
      name: studentName,
      state: obj.state,
      last_login: obj.last_login?obj.last_login:"",
      date_created: obj.date_created?obj.date_created:""
		});
			
	});
	return list;
};

module.exports = superAdminVeteranModel;