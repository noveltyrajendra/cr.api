
let superAdminPartnerCollegeUserActivityModel = function (src,src1,src2,src3) {
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list = [];
    for(let i=0;i<src.length;i++){
        if(src[i].id == src1[i].id && src[i].id == src2[i].id && src[i].id == src3[i].id)
        {
            list.push({
                collegeId: src[i].id,
                specificName: src[i].specificname,
                collegeName: src[i].college_name,
                thisMonthSearchBox: parseInt(src[i].searchboxtotal) ? parseInt(src[i].searchboxtotal) : 0,
                thisMonthStudentCount: parseInt(src[i].scount),
                lastMonthSearchBox: parseInt(src1[i].searchboxtotal1) ? parseInt(src1[i].searchboxtotal1) : 0,
                lastMonthStudentCount: parseInt(src1[i].scount1),
                lastTwoMonthSearchBox: parseInt(src2[i].searchboxtotal2) ? parseInt(src2[i].searchboxtotal2) : 0,
                lastTwoMonthStudentCount: parseInt(src2[i].scount2),
                lastThreeMonthSearchBox: parseInt(src3[i].searchboxtotal3) ? parseInt(src3[i].searchboxtotal3) : 0,
                lastThreeMonthStudentCount: parseInt(src3[i].scount3)
            });
        }
    }
    return list;
};

module.exports = superAdminPartnerCollegeUserActivityModel;