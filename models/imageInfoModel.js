var imageInfoModel = function(obj,logoDimension,photoDimension,bannerDimension){
  
    var config = require('../config');
    var imageList=[];
    imageList.push({
        collegeName: obj.college_name,
        collegeAlias: obj.college_alias,
        collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_logo,
        logoWidth: logoDimension?logoDimension.width:0,
        logoHeight: logoDimension?logoDimension.height:0,
        collegePhoto: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_photo,
        photoWidth: photoDimension?photoDimension.width:0,
        photoHeight: photoDimension?photoDimension.height:0,
        collegeBanner: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_banner,
        bannerWidth: bannerDimension?bannerDimension.width:0,
        bannerHeight: bannerDimension?bannerDimension.height:0,
    });
    return imageList;
  };
  
  module.exports = imageInfoModel;