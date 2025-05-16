var studentMessageinfoModel = function(src){
	var config = require('../config');
	var list=[];
	src.forEach(function(obj)
	{	
		list.push({
			firstName:obj.first_name,
			lastName:obj.last_name,
			email:obj.email,
			dateRegister: obj.date_created,
			militaryStatus:obj.military_status,
      		middleInitial:obj.middle_initial,
			branchName:obj.branch_full_name?obj.branch_full_name:"",
			branchShortName:obj.branch_short_name?obj.branch_short_name:"",
			rankName: obj.name?obj.name:"",
			academicInterest1:obj.academic1?obj.academic1:"",
			academicInterest2:obj.academic2?obj.academic2:"",
			academicInterest3:obj.academic3?obj.academic3:"",
			academicInterest4:obj.academic4?obj.academic4:"",
			academicInterest5:obj.academic5?obj.academic5:"",
			phoneNumber: obj.phone_number?obj.phone_number:"",
			checkPhoneNumber: obj.check_phone_number,
			state: obj.state,
			jstInfo: obj.jst_transcript_file?'Yes':'No',
			bucketName: obj.bucket?obj.bucket:"",
			zipCode: obj.postal_code?obj.postal_code:"",
			academicLevel: obj.academiclevel?obj.academiclevel:""
		});
			
	});
	return list;
};

module.exports = studentMessageinfoModel;