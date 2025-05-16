let collegeStudentContactModel = function(src){
	let config = require('../config');
  let list=[];
  let pimage= "";
  let privacyuniversal= "";
  let privacyphoto= "";
  let privacypersonal= "";
  let privacycontact= "";
  let privacyacademic= "";
  let displaydata= "";
  let fullName = "";
	src.forEach(function(obj)
	{	
    if(obj.profile_image == ""){
			pimage = "";
		}else{
			pimage = obj.profile_image;
    }
    privacyuniversal = obj.privacy_universal.toLocaleLowerCase();
    if(privacyuniversal == "no"){
      privacyphoto = obj.privacy_photo.toLocaleLowerCase();
      privacypersonal = obj.privacy_personal.toLocaleLowerCase();
      privacycontact = obj.privacy_contact.toLocaleLowerCase();
      privacyacademic = obj.privacy_academic.toLocaleLowerCase();
      displaydata= "Information Hidden";
    }else if(privacyuniversal == "yes"){
      privacyphoto = "yes";
      privacypersonal = "yes";
      privacycontact = "yes";
      privacyacademic = "yes";
      displaydata= "Did not provide";
    }

    if(obj.middle_initial == " " || obj.middle_initial == null){
      fullName = obj.first_name+" "+obj.last_name;
    }else{
      fullName = obj.first_name+" "+obj.middle_initial+" "+obj.last_name;
    }
    
		list.push({
      studentId: obj.uuid,
      fullName: (privacypersonal == "yes")?displaydata:fullName,
      status: (privacycontact == "yes")?displaydata:obj.military_status,
      city: (privacypersonal == "yes")?displaydata:obj.city,
      state: (privacypersonal == "yes")?displaydata:obj.state,
      gpa: (privacyacademic == "yes")?displaydata:obj.gpa,
      actScore: (privacyacademic == "yes")?displaydata:obj.act_score,
      satScore: (privacyacademic == "yes")?displaydata:obj.sat_score,
      branchName: (privacycontact == "yes")?displaydata:obj.branch_short_name,
      profileImage: (privacyphoto == "yes")?displaydata:config.AWS_IMAGE_RESOURCE_STUDENT+pimage
		});
			
	});
	return list;
};

module.exports = collegeStudentContactModel;