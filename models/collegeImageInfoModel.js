var collegeImageInfoModel = function(src){

	var config = require('../config');
	let stringUtil = require('../utils/stringUtil');
	var imageList=[];
	src.forEach(function(obj)
	{	
		let imageSize = "";
		if(obj.size){
			imageSize = Math.round(obj.size/1024);
        }
        
		imageList.push({
			id:obj.id,
			collegeId: obj.college_id,
            collegeName:obj.collegename,
            imageType:obj.image_type,
			height:obj.height,
			width:obj.width,
			size:imageSize,
            uploadDate:obj.upload_date,
            collegeAdmin:obj.collegeadmin?obj.collegeadmin:obj.admin
		});

	});
	return imageList;
};

module.exports = collegeImageInfoModel;