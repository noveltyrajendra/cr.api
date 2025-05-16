let collegeInboxMessageModel = function(src){
	let config = require('../config');
  let list=[];
  let cimage= "";
  let pimage="";
  let attdata="";
  let attname="";
	src.forEach(function(obj)
	{	
    if(obj.college_logo == ""){
			cimage = "no-college.png";
		}else{
			cimage = obj.college_logo;
    }

    if(obj.profile_image == ""){
			pimage = "no-profile.png";
		}else{
			pimage = obj.profile_image;
    }

    if(obj.attachment == "" || obj.attachment == null){
			attdata = "";
		}else{
      let aname = obj.attachment.split("/");
      attname = aname[aname.length - 1];
			attdata = obj.attachment;
    }
    
		list.push({
			id:obj.id,
			responder:obj.responder,
      recipient:obj.recipient,
      messageId:obj.message_id,
      studentId: obj.student_id,
      collegeId: obj.college_id,
      message: obj.message,
      messageState: obj.message_state,
      attachmentName: attname,
      attachment: attdata,
      dateCreated: obj.date_created,
      collegeName: obj.college_name,
      collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE+cimage,
      profileImage: config.AWS_IMAGE_RESOURCE_STUDENT+pimage,
      firstName:obj.first_name,
      middleName: obj.middle_initial,
      lastName: obj.last_name,
      email: obj.email
		});
			
	});
	return list;
};

module.exports = collegeInboxMessageModel;