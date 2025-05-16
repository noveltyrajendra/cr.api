let superAdminCollegeListModel = function (src) {
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list = [];

  src.forEach(function (obj) {
    list.push({
      collegeId: obj.id,
      collegeName: stringUtil.manageCollegeName(obj.college_name),
      collegeAbbreviation: obj.college_abbreviation,
      collegeAlias: obj.college_alias,
      //address: obj.address,
      //address2: obj.address2,
      //city: obj.city,
      state: obj.state,
      postalCode: obj.postal_code,
      accessLevel: obj.access_level,
      collegeType: obj.college_type,
      status: obj.status
    });

  });
  return list;
};

module.exports = superAdminCollegeListModel;