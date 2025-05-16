let superAdminCommunicationModel = function(src){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let moment = require('moment-timezone');
  let list=[];
  
	src.forEach(function(obj)
	{	
    let from = "";
    let to = "";
    let studentName = obj.first_name+(obj.middle_initial? ' '+obj.middle_initial:'')+' '+obj.last_name;
    let collegeName = obj.college_name;
    if(obj.responder == 'COLLEGE'){
      from = collegeName;
      to = studentName;
    }else{
      from = studentName;
      to = collegeName;
    }
    
		list.push({
      id:obj.id,
      date: obj.date_created,
      from: from,
      to: to,
      message: obj.message
		});
			
	});
	return list;
};

module.exports = superAdminCommunicationModel;