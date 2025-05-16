let registerMessageInfoModel = function (cdata) {
    let list = [];
  
    cdata.forEach(function(obj) {
      if(obj.atregister > 0 || obj.afterregister > 0 || obj.collegecontact > 0 || obj.followup > 0) {
        list.push({
          name: obj.first_name + " " + obj.last_name,
          email: obj.email,
          date: obj.date_created?obj.date_created:"",
          atregister: obj.atregister?obj.atregister:0,
          afterregister: obj.afterregister?obj.afterregister:0,
          collegecontact: obj.collegecontact?obj.collegecontact:0,
          followup: obj.followup?obj.followup:0
        })
      }
    })
  
    return list;
  };
  
  module.exports = registerMessageInfoModel;