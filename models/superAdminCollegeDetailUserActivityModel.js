let superAdminCollegeDetailUserActivityModel = function(src){
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let list=[];
    
      src.forEach(function(obj)
      {	
        list.push({
            year:obj.year,
            month: obj.month,
            numMonth: obj.allmonth,
            searchBox: parseInt(obj.searchboxtotal)? parseInt(obj.searchboxtotal):0,
            searchResult: parseInt(obj.searchresult)?parseInt(obj.searchresult):0,
            studentContact: parseInt(obj.scount),
            noreplyMessage: parseInt(obj.noreply)?parseInt(obj.noreply):0,
            savedSchool: parseInt(obj.savedschool)?parseInt(obj.savedschool):0,
            pageTime: parseInt(obj.pagetime)?parseInt(obj.pagetime):0,
            averageTime: parseFloat(obj.averagetime)?parseFloat(obj.averagetime):0, 
            clickTotal: parseInt(obj.clicktotal)?parseInt(obj.clicktotal):0,
        });
              
      });
      return list;
  };
  
  module.exports = superAdminCollegeDetailUserActivityModel;