var config = require('../config');
const uuidv4 = require('uuid/v4');

var imageUploadService = (()=> {
	async function uploadImage(image){
		return new Promise((resolve, reject)=> {
			if(!image)
				resolve(null);

			let imageName = uuidv4();
			let extension ='.'+image.name.substr(image.name.lastIndexOf('.') + 1);
			let publicImagePath=config.config.AWS_IMAGE_RESOURCE_SOCIAL+uuidv4()+extension;
			image.mv(imagePath, (err)=> {
				if (!err)
					resolve(publicImagePath);
				else
					resolve(null);
			});
		});	
	}
	
	return {
		uploadImage:uploadImage
	}

})();

module.exports = imageUploadService;