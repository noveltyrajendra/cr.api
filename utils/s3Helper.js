var s3Helper = (function () {
    let AWS = require('aws-sdk');
    let config = require('../config');

    AWS.config.update({
		accessKeyId: config.ACCESS_KEY_ID,
		secretAccessKey: config.ACCESS_SECRET_KEY,
		region: config.REGION,
	  });

    function getS3Object(name){
        return new Promise(function (resolve, reject) {
            var s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});
            var params = {
                Bucket: config.BUCKET_NAME,
                Key: 'assets/college-assets/'+name
            }
            s3.getObject(params, function(err, data) {
                if(err) {
                    return (resolve(0));
                }else{
                    if(data.Body){
                        return (resolve(data.Body));
                    }else{
                        return (resolve(0));
                    }
                }
            })    
        })
    } 

    function uploadCompanyLogo(bitmap, imageName){
        return new Promise(function (resolve, reject) {
            let params = {
				Key: 'assets/company-assets/'+imageName,
				Body: bitmap,
				contentType: 'image/jpeg',
				ACL: 'public-read'
			}

			let s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});
            s3.upload(params, function(err, data) {
				if(err) {
					console.log(err, err.stack);
				} else {
                    return (resolve("success"));
				}
			})
            
        })
    }

    function deleteS3Object(name,type){
        return new Promise(async function (resolve, reject) {
            let keyInfo = "";
            if(type == 'company'){
                keyInfo = 'assets/company-assets/'+name
            }
            var s3 = new AWS.S3({params: {Bucket: config.BUCKET_NAME}});
            var params = {
                Bucket: config.BUCKET_NAME,
                Key: keyInfo,
                VersionId: 'null'
            }
            s3.deleteObject(params, function(err, data) {
                if(err) {
                    return (resolve(0));
                }else{
                    if(data.Body){
                        return (resolve(data.Body));
                    }else{
                        return (resolve(0));
                    }
                }
            })  
        })
    }

    return {
        getS3Object: getS3Object,
        uploadCompanyLogo: uploadCompanyLogo,
        deleteS3Object: deleteS3Object
    }
})();

module.exports = s3Helper;