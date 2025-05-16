let superAdminVeteranMessageModel = function(src){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list=[];
  
	src.forEach(function(obj)
	{	
		list.push({
      mid: obj.id,
      messageId:obj.message_id,
      collegeId:obj.cid,
      collegeName: obj.college_name,
      contactEmail: obj.contact_email,
      message: obj.message,
      dateCreated: obj.date_created?obj.date_created:""
		});
			
	});
	return list;
};

module.exports = superAdminVeteranMessageModel;