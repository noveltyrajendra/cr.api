let studentInboxMessageModel = function(src){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list=[];
  let cimage= "";
  let pimage="";
  let attdata="";
  let attname="";
  let collegeSeo = "";
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

    if(obj.seo_name){
			collegeSeo = obj.seo_name;
		}else{
			collegeSeo = obj.college_name;
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
      collegeAlias: obj.college_alias,
      collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE+cimage,
      collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
      profileImage: config.AWS_IMAGE_RESOURCE_STUDENT+pimage,
      collegeEmail: obj.contact_email
		});
			
	});
	return list;
};

module.exports = studentInboxMessageModel;