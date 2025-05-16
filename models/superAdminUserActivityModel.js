let superAdminUserActivityModel = function(src,src1,src2,src3,src4,src5,src6,src7){
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list=[];
    
      /*src.forEach(function(obj)
      {	
        list.push({
            collegeId:obj.id,
            collegeName: obj.college_name,
            year:obj.year,
            month: obj.month,
            searchBox: parseInt(obj.searchboxtotal)? parseInt(obj.searchboxtotal):0,
            searchResult: parseInt(obj.searchresult)?parseInt(obj.searchresult):0,
            studentContact: parseInt(obj.scount),
            noreplyMessage: parseInt(obj.noreply)?parseInt(obj.noreply):0,
            savedSchool: parseInt(obj.savedschool)?parseInt(obj.savedschool):0
        });
              
      });*/
        for(let i=0;i<src.length;i++){
          if(src[i].id == src1[i].id && src[i].id == src2[i].id)
          {
              list.push({
                  collegeId: src[i].id,
                  collegeName: src[i].college_name,
                  searchBox: parseInt(src2[i].searchboxtotal) ? parseInt(src2[i].searchboxtotal) : 0,
                  studentContact: parseInt(src1[i].scount)?parseInt(src1[i].scount):0,
                  noreplyMessage: parseInt(src[i].noreply)?parseInt(src[i].noreply):0,
                  searchResult: stringUtil.checkValInAssociativeArray(src[i].id,src3),
                  savedSchool: stringUtil.checkSavedAssociativeArray(src[i].id,src4),
                  bookmarkSchools: stringUtil.checkBookmarkAssociativeArray(src[i].id,src5),
                  contactinfo: stringUtil.checkContactInfoAssociativeArray(src[i].id,src6),
                  tabclicked: stringUtil.checkTabClickedAssociativeArray(src[i].id,src7),
              });
          }
      }
      return list;
  };
  
  module.exports = superAdminUserActivityModel;