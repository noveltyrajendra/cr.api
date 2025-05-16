const collegeParentChildModel = async function (src) {
    const config = require('../config');
	const stringUtil = require('../utils/stringUtil');
    const list = [];
    src.forEach(function (obj) {
        list.push({
            collegeId: obj.id,
			collegeAlias: obj.college_alias,
			collegeName: stringUtil.manageCollegeName(obj.college_name),
            collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_logo,
        });
    });
    return list;
};

module.exports = collegeParentChildModel;